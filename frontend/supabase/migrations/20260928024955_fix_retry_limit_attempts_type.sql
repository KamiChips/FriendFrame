CREATE OR REPLACE FUNCTION public.check_email_retry_limit(user_email text)
 RETURNS TABLE(can_retry boolean, retry_after_seconds integer, attempts_used integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$declare
  rec email_verification_retries%rowtype;
  base_wait_seconds int := 60;
  max_attempts int := 3;
  required_wait int;
  elapsed_since_last int;
begin
  select * into rec
  from email_verification_retries
  where email = user_email
  for update;

  if rec is null then
    insert into email_verification_retries (email, attempt_count, window_started_at, last_attempt_at)
    values (user_email, 1, now(), now());
    return query select true, 0, 1;
    return;
  end if;

  if now() - rec.window_started_at > interval '1 hour' then
    update email_verification_retries
      set attempt_count = 1, window_started_at = now(), last_attempt_at = now()
      where email = user_email;
    return query select true, 0, 1;
    return;
  end if;

  if rec.attempt_count >= max_attempts then
    return query select false,
      ceil(extract(epoch from (rec.window_started_at + interval '1 hour' - now())))::int,
      rec.attempt_count::int;
    return;
  end if;

  required_wait := base_wait_seconds * power(2, rec.attempt_count - 1);
  elapsed_since_last := extract(epoch from (now() - rec.last_attempt_at));

  if elapsed_since_last < required_wait then
    return query select false, (required_wait - elapsed_since_last)::int, rec.attempt_count::int;
    return;
  end if;

  update email_verification_retries
    set attempt_count = attempt_count + 1, last_attempt_at = now()
    where email = user_email;

  return query select true, 0, (rec.attempt_count + 1)::int;
end;$function$
