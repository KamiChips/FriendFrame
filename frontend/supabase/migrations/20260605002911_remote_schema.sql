


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."notification_type" AS ENUM (
    'new_follower',
    'new_post',
    'new_fragment',
    'new_message'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_friendship"("author_id" "uuid", "profile_owner_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM follows f1
    JOIN follows f2
      ON f1.follower_id  = f2.following_id
     AND f1.following_id = f2.follower_id
    WHERE f1.follower_id  = author_id
      AND f1.following_id = profile_owner_id
  );
$$;


ALTER FUNCTION "public"."assert_friendship"("author_id" "uuid", "profile_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_friendship_rpc"("user_a" "uuid", "user_b" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.follows f1
    JOIN public.follows f2
      ON f1.follower_id  = f2.following_id
     AND f1.following_id = f2.follower_id
    WHERE f1.follower_id  = user_a
      AND f1.following_id = user_b
  );
$$;


ALTER FUNCTION "public"."assert_friendship_rpc"("user_a" "uuid", "user_b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_blocks_between"("user_a" "uuid", "user_b" "uuid") RETURNS TABLE("a_blocked_b" boolean, "b_blocked_a" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM blocks
      WHERE blocker_id = user_a AND blocked_id = user_b
    ) AS a_blocked_b,
    EXISTS (
      SELECT 1 FROM blocks
      WHERE blocker_id = user_b AND blocked_id = user_a
    ) AS b_blocked_a;
$$;


ALTER FUNCTION "public"."check_blocks_between"("user_a" "uuid", "user_b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_friends"("target_user_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT COUNT(*)
  FROM follows f1
  JOIN follows f2
    ON f1.follower_id  = f2.following_id
   AND f1.following_id = f2.follower_id
  WHERE f1.following_id = target_user_id;
$$;


ALTER FUNCTION "public"."count_friends"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_direct_chat"("user_a" "uuid", "user_b" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT cm1.chat_id
  FROM public.chat_members cm1
  JOIN public.chat_members cm2
    ON cm1.chat_id = cm2.chat_id
  JOIN public.chat c
    ON c.chat_id  = cm1.chat_id
  WHERE cm1.user_id  = user_a
    AND cm2.user_id  = user_b
    AND c.is_group   = false
  LIMIT 1;
$$;


ALTER FUNCTION "public"."find_direct_chat"("user_a" "uuid", "user_b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_comment_stats"("comment_ids" "uuid"[], "current_user_id" "uuid") RETURNS TABLE("comment_id" "uuid", "likes_count" bigint, "replies_count" bigint, "liked_by_me" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    c.comment_id,
    0::BIGINT AS likes_count,
    COUNT(DISTINCT r.comment_id) AS replies_count,
    FALSE AS liked_by_me
  FROM unnest(comment_ids) AS cid(comment_id)
  JOIN public.comments c  ON c.comment_id        = cid.comment_id
  LEFT JOIN public.comments r ON r.parent_comment_id = c.comment_id
  GROUP BY c.comment_id;
$$;


ALTER FUNCTION "public"."get_comment_stats"("comment_ids" "uuid"[], "current_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_followers_with_relationship"("target_user_id" "uuid", "current_user_id" "uuid", "p_limit" integer DEFAULT 30, "p_offset" integer DEFAULT 0) RETURNS TABLE("user_id" "uuid", "full_name" character varying, "username" character varying, "profile_pic" "text", "i_follow_them" boolean, "is_friend" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    u.user_id,
    u.full_name,
    u.username,
    u.profile_pic,
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id  = current_user_id
        AND following_id = u.user_id
    ) AS i_follow_them,
    EXISTS (
      SELECT 1 FROM follows f1
      JOIN follows f2
        ON f1.follower_id  = f2.following_id
       AND f1.following_id = f2.follower_id
      WHERE f1.follower_id  = current_user_id
        AND f1.following_id = u.user_id
    ) AS is_friend
  FROM follows f
  JOIN public.users u ON u.user_id = f.follower_id
  WHERE f.following_id = target_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION "public"."get_followers_with_relationship"("target_user_id" "uuid", "current_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_following_with_relationship"("target_user_id" "uuid", "current_user_id" "uuid", "p_limit" integer DEFAULT 30, "p_offset" integer DEFAULT 0) RETURNS TABLE("user_id" "uuid", "full_name" character varying, "username" character varying, "profile_pic" "text", "i_follow_them" boolean, "is_friend" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    u.user_id,
    u.full_name,
    u.username,
    u.profile_pic,
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id  = current_user_id
        AND following_id = u.user_id
    ) AS i_follow_them,
    EXISTS (
      SELECT 1 FROM follows f1
      JOIN follows f2
        ON f1.follower_id  = f2.following_id
       AND f1.following_id = f2.follower_id
      WHERE f1.follower_id  = current_user_id
        AND f1.following_id = u.user_id
    ) AS is_friend
  FROM follows f
  JOIN public.users u ON u.user_id = f.following_id
  WHERE f.follower_id = target_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION "public"."get_following_with_relationship"("target_user_id" "uuid", "current_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friends"("target_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "full_name" character varying, "username" character varying, "profile_pic" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    u.user_id,
    u.full_name,
    u.username,
    u.profile_pic
  FROM follows f1
  JOIN follows f2
    ON f1.follower_id  = f2.following_id
   AND f1.following_id = f2.follower_id
  JOIN public.users u ON u.user_id = f1.follower_id
  WHERE f1.following_id = target_user_id
  ORDER BY u.full_name ASC;
$$;


ALTER FUNCTION "public"."get_friends"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_home_feed"("p_user_id" "uuid", "p_limit" integer DEFAULT 21, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "pub_type" "text", "author_id" "uuid", "account_owner_id" "uuid", "media" "text", "media_type" "text", "description" "text", "content" "text", "created_at" timestamp with time zone, "author_username" character varying, "author_full_name" character varying, "author_pic" "text", "owner_username" character varying, "owner_full_name" character varying, "owner_pic" "text", "likes_count" bigint, "comments_count" bigint, "shares_count" bigint, "liked_by_me" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$

  SELECT
    p.post_id         AS id,
    'post'::TEXT      AS pub_type,
    p.author_id,
    p.account_owner_id,
    p.media,
    p.media_type::TEXT,
    p.description,
    NULL::TEXT        AS content,
    p.created_at,
    a.username        AS author_username,
    a.full_name       AS author_full_name,
    a.profile_pic     AS author_pic,
    o.username        AS owner_username,
    o.full_name       AS owner_full_name,
    o.profile_pic     AS owner_pic,
    COUNT(DISTINCT l.like_id)              AS likes_count,
    COUNT(DISTINCT c.comment_id)           AS comments_count,
    COUNT(DISTINCT s.share_id)             AS shares_count,
    BOOL_OR(l.user_id = p_user_id)        AS liked_by_me
  FROM public.posts p
  -- Solo de personas que sigue el usuario
  JOIN public.follows f
    ON f.follower_id  = p_user_id
   AND f.following_id = p.author_id
  JOIN public.users a ON a.user_id = p.author_id
  JOIN public.users o ON o.user_id = p.account_owner_id
  LEFT JOIN public.likes    l ON l.post_id = p.post_id
  LEFT JOIN public.comments c ON c.post_id = p.post_id
  LEFT JOIN public.shares   s ON s.post_id = p.post_id
  GROUP BY
    p.post_id, p.media, p.media_type, p.description,
    p.author_id, p.account_owner_id, p.created_at,
    a.username, a.full_name, a.profile_pic,
    o.username, o.full_name, o.profile_pic

  UNION ALL

  -- Fragments de personas que sigue el usuario
  SELECT
    fr.fragment_id    AS id,
    'fragment'::TEXT  AS pub_type,
    fr.author_id,
    fr.account_owner_id,
    NULL::TEXT        AS media,
    NULL::TEXT        AS media_type,
    NULL::TEXT        AS description,
    fr.content,
    fr.created_at,
    a.username        AS author_username,
    a.full_name       AS author_full_name,
    a.profile_pic     AS author_pic,
    o.username        AS owner_username,
    o.full_name       AS owner_full_name,
    o.profile_pic     AS owner_pic,
    COUNT(DISTINCT l.like_id)              AS likes_count,
    COUNT(DISTINCT c.comment_id)           AS comments_count,
    COUNT(DISTINCT s.share_id)             AS shares_count,
    BOOL_OR(l.user_id = p_user_id)        AS liked_by_me
  FROM public.fragments fr
  JOIN public.follows f
    ON f.follower_id  = p_user_id
   AND f.following_id = fr.author_id
  JOIN public.users a ON a.user_id = fr.author_id
  JOIN public.users o ON o.user_id = fr.account_owner_id
  LEFT JOIN public.likes    l ON l.fragment_id = fr.fragment_id
  LEFT JOIN public.comments c ON c.fragment_id = fr.fragment_id
  LEFT JOIN public.shares   s ON s.fragment_id = fr.fragment_id
  GROUP BY
    fr.fragment_id, fr.content,
    fr.author_id, fr.account_owner_id, fr.created_at,
    a.username, a.full_name, a.profile_pic,
    o.username, o.full_name, o.profile_pic

  ORDER BY created_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;

$$;


ALTER FUNCTION "public"."get_home_feed"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inbox"("p_user_id" "uuid") RETURNS TABLE("chat_id" "uuid", "is_group" boolean, "group_name" character varying, "created_by" "uuid", "created_at" timestamp with time zone, "last_msg_content" "text", "last_msg_sender" "uuid", "last_msg_at" timestamp with time zone, "last_msg_username" character varying, "unread_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    c.chat_id,
    c.is_group,
    c.group_name,
    c.created_by,
    c.created_at,
    lm.content         AS last_msg_content,
    lm.sender_id       AS last_msg_sender,
    lm.created_at      AS last_msg_at,
    u.username         AS last_msg_username,
    COUNT(um.message_id) FILTER (
      WHERE um.is_read = false
        AND um.sender_id <> p_user_id
    )                  AS unread_count
  FROM public.chat_members cm
  JOIN public.chat c
    ON c.chat_id = cm.chat_id
  -- LATERAL: obtiene el último mensaje de cada chat en el mismo JOIN
  LEFT JOIN LATERAL (
    SELECT content, sender_id, created_at
    FROM public.messages
    WHERE chat_id = c.chat_id
    ORDER BY created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN public.users u
    ON u.user_id = lm.sender_id
  -- JOIN para calcular no leídos (puede ser NULL si no hay mensajes)
  LEFT JOIN public.messages um
    ON um.chat_id = c.chat_id
  WHERE cm.user_id = p_user_id
  GROUP BY
    c.chat_id,
    c.is_group,
    c.group_name,
    c.created_by,
    c.created_at,
    lm.content,
    lm.sender_id,
    lm.created_at,
    u.username
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC NULLS LAST;
$$;


ALTER FUNCTION "public"."get_inbox"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_stats"("target_user_id" "uuid") RETURNS TABLE("followers_count" bigint, "following_count" bigint, "friends_count" bigint, "posts_count" bigint, "fragments_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    (SELECT COUNT(*) FROM follows WHERE following_id = target_user_id) AS followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id  = target_user_id) AS following_count,
    (SELECT COUNT(*)
     FROM follows f1
     JOIN follows f2
       ON f1.follower_id  = f2.following_id
      AND f1.following_id = f2.follower_id
     WHERE f1.following_id = target_user_id
    ) AS friends_count,
    (SELECT COUNT(*) FROM posts     WHERE account_owner_id = target_user_id) AS posts_count,
    (SELECT COUNT(*) FROM fragments WHERE account_owner_id = target_user_id) AS fragments_count;
$$;


ALTER FUNCTION "public"."get_profile_stats"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_publication_counts"("post_ids" "uuid"[], "fragment_ids" "uuid"[], "current_user_id" "uuid") RETURNS TABLE("pub_id" "uuid", "pub_type" "text", "likes_count" bigint, "comments_count" bigint, "shares_count" bigint, "liked_by_me" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    p.post_id AS pub_id,
    'post'    AS pub_type,
    COUNT(DISTINCT l.like_id)            AS likes_count,
    COUNT(DISTINCT c.comment_id)         AS comments_count,
    COUNT(DISTINCT s.share_id)           AS shares_count,
    BOOL_OR(l.user_id = current_user_id) AS liked_by_me
  FROM unnest(post_ids) AS pid(post_id)
  JOIN public.posts p ON p.post_id = pid.post_id
  LEFT JOIN public.likes    l ON l.post_id = p.post_id
  LEFT JOIN public.comments c ON c.post_id = p.post_id
  LEFT JOIN public.shares   s ON s.post_id = p.post_id
  GROUP BY p.post_id

  UNION ALL

  SELECT
    f.fragment_id AS pub_id,
    'fragment'    AS pub_type,
    COUNT(DISTINCT l.like_id)            AS likes_count,
    COUNT(DISTINCT c.comment_id)         AS comments_count,
    COUNT(DISTINCT s.share_id)           AS shares_count,
    BOOL_OR(l.user_id = current_user_id) AS liked_by_me
  FROM unnest(fragment_ids) AS fid(fragment_id)
  JOIN public.fragments f ON f.fragment_id = fid.fragment_id
  LEFT JOIN public.likes    l ON l.fragment_id = f.fragment_id
  LEFT JOIN public.comments c ON c.fragment_id = f.fragment_id
  LEFT JOIN public.shares   s ON s.fragment_id = f.fragment_id
  GROUP BY f.fragment_id;
$$;


ALTER FUNCTION "public"."get_publication_counts"("post_ids" "uuid"[], "fragment_ids" "uuid"[], "current_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_relationship_status"("current_user_id" "uuid", "target_user_id" "uuid") RETURNS TABLE("i_follow_them" boolean, "they_follow_me" boolean, "is_friend" boolean, "is_blocked" boolean, "blocked_me" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id  = current_user_id
        AND following_id = target_user_id
    ) AS i_follow_them,

    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id  = target_user_id
        AND following_id = current_user_id
    ) AS they_follow_me,

    EXISTS (
      SELECT 1 FROM follows f1
      JOIN follows f2
        ON f1.follower_id  = f2.following_id
       AND f1.following_id = f2.follower_id
      WHERE f1.follower_id  = current_user_id
        AND f1.following_id = target_user_id
    ) AS is_friend,

    EXISTS (
      SELECT 1 FROM blocks
      WHERE blocker_id = current_user_id
        AND blocked_id = target_user_id
    ) AS is_blocked,

    EXISTS (
      SELECT 1 FROM blocks
      WHERE blocker_id = target_user_id
        AND blocked_id = current_user_id
    ) AS blocked_me;
$$;


ALTER FUNCTION "public"."get_relationship_status"("current_user_id" "uuid", "target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_unread_messages"("p_user_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COUNT(m.message_id)
  FROM public.chat_members cm
  JOIN public.messages m
    ON m.chat_id    = cm.chat_id
  WHERE cm.user_id   = p_user_id
    AND m.is_read    = false
    AND m.sender_id <> p_user_id;
$$;


ALTER FUNCTION "public"."get_total_unread_messages"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notification_counts"("p_user_id" "uuid") RETURNS TABLE("total_count" bigint, "follows_count" bigint, "posts_count" bigint, "messages_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    COUNT(*)                                                             AS total_count,
    COUNT(*) FILTER (WHERE type = 'new_follower')                         AS follows_count,
    COUNT(*) FILTER (WHERE type IN ('new_post', 'new_fragment'))        AS posts_count,
    COUNT(*) FILTER (WHERE type = 'new_message')                        AS messages_count
  FROM notifications
  WHERE user_id = p_user_id
    AND is_read = false;
$$;


ALTER FUNCTION "public"."get_unread_notification_counts"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_with_relationship"("user_ids" "uuid"[], "current_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "full_name" character varying, "username" character varying, "profile_pic" "text", "i_follow_them" boolean, "is_friend" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    u.user_id,
    u.full_name,
    u.username,
    u.profile_pic,
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id  = current_user_id
        AND following_id = u.user_id
    ) AS i_follow_them,
    EXISTS (
      SELECT 1 FROM follows f1
      JOIN follows f2
        ON f1.follower_id  = f2.following_id
       AND f1.following_id = f2.follower_id
      WHERE f1.follower_id  = current_user_id
        AND f1.following_id = u.user_id
    ) AS is_friend
  FROM public.users u
  WHERE u.user_id = ANY(user_ids);
$$;


ALTER FUNCTION "public"."get_users_with_relationship"("user_ids" "uuid"[], "current_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
begin
  insert into public.users (user_id, email, full_name, username)
  values(
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_chat_member"("p_chat_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE chat_id = p_chat_id AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_chat_member"("p_chat_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_users"("search_query" "text", "current_user_id" "uuid", "result_limit" integer DEFAULT 20) RETURNS TABLE("user_id" "uuid", "full_name" character varying, "username" character varying, "profile_pic" "text", "i_follow_them" boolean, "is_friend" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT
    u.user_id,
    u.full_name,
    u.username,
    u.profile_pic,
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id  = current_user_id
        AND following_id = u.user_id
    ) AS i_follow_them,
    EXISTS (
      SELECT 1 FROM follows f1
      JOIN follows f2
        ON f1.follower_id  = f2.following_id
       AND f1.following_id = f2.follower_id
      WHERE f1.follower_id  = current_user_id
        AND f1.following_id = u.user_id
    ) AS is_friend
  FROM public.users u
  WHERE
    u.user_id <> current_user_id
    AND (
      u.username  ILIKE '%' || search_query || '%'
      OR u.full_name ILIKE '%' || search_query || '%'
    )
    AND u.user_id NOT IN (
      SELECT blocked_id FROM blocks WHERE blocker_id = current_user_id
      UNION
      SELECT blocker_id FROM blocks WHERE blocked_id = current_user_id
    )
  ORDER BY
    -- Priorizar coincidencias exactas de username
    CASE WHEN u.username = search_query THEN 0 ELSE 1 END,
    u.full_name ASC
  LIMIT result_limit;
$$;


ALTER FUNCTION "public"."search_users"("search_query" "text", "current_user_id" "uuid", "result_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
begin 
  new.updated_at = now();
  return new; 
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_like"("p_user_id" "uuid", "p_post_id" "uuid" DEFAULT NULL::"uuid", "p_fragment_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("liked" boolean, "likes_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_liked BOOLEAN;
BEGIN
  -- Validar que exactamente uno de los dos es NOT NULL
  IF (p_post_id IS NULL) = (p_fragment_id IS NULL) THEN
    RAISE EXCEPTION 'Especifica exactamente uno: p_post_id o p_fragment_id';
  END IF;
 
  IF p_post_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM likes WHERE user_id = p_user_id AND post_id = p_post_id
    ) THEN
      DELETE FROM likes WHERE user_id = p_user_id AND post_id = p_post_id;
      v_liked := FALSE;
    ELSE
      INSERT INTO likes (user_id, post_id) VALUES (p_user_id, p_post_id);
      v_liked := TRUE;
    END IF;
    RETURN QUERY SELECT v_liked, COUNT(*) FROM likes WHERE post_id = p_post_id;
  ELSE
    IF EXISTS (
      SELECT 1 FROM likes WHERE user_id = p_user_id AND fragment_id = p_fragment_id
    ) THEN
      DELETE FROM likes WHERE user_id = p_user_id AND fragment_id = p_fragment_id;
      v_liked := FALSE;
    ELSE
      INSERT INTO likes (user_id, fragment_id) VALUES (p_user_id, p_fragment_id);
      v_liked := TRUE;
    END IF;
    RETURN QUERY SELECT v_liked, COUNT(*) FROM likes WHERE fragment_id = p_fragment_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_like"("p_user_id" "uuid", "p_post_id" "uuid", "p_fragment_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "block_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blocks_check" CHECK (("blocker_id" <> "blocked_id"))
);


ALTER TABLE "public"."blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat" (
    "chat_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_group" boolean DEFAULT false NOT NULL,
    "group_name" character varying(80),
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ck_group_name" CHECK (((("is_group" = true) AND ("group_name" IS NOT NULL)) OR ("is_group" = false)))
);


ALTER TABLE "public"."chat" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_members" (
    "chat_members_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "comment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid",
    "fragment_id" "uuid",
    "parent_comment_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ck_comments_one_target" CHECK (((("post_id" IS NOT NULL) AND ("fragment_id" IS NULL)) OR (("post_id" IS NULL) AND ("fragment_id" IS NOT NULL))))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_tokens" (
    "token_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "platform" character varying(10) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "device_tokens_platform_check" CHECK ((("platform")::"text" = ANY ((ARRAY['ios'::character varying, 'android'::character varying, 'web'::character varying])::"text"[])))
);


ALTER TABLE "public"."device_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "follow_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fragments" (
    "fragment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "account_owner_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fragments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "like_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid",
    "fragment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ck_likes_one_target" CHECK (((("post_id" IS NOT NULL) AND ("fragment_id" IS NULL)) OR (("post_id" IS NULL) AND ("fragment_id" IS NOT NULL))))
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "message_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "notification_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "post_id" "uuid",
    "fragment_id" "uuid",
    "message_id" "uuid",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "post_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "account_owner_id" "uuid" NOT NULL,
    "media" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "media_type" character varying(10) DEFAULT 'image'::character varying NOT NULL,
    CONSTRAINT "posts_media_type_check" CHECK ((("media_type")::"text" = ANY ((ARRAY['image'::character varying, 'video'::character varying])::"text"[])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shares" (
    "share_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid",
    "fragment_id" "uuid",
    "chat_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ck_shares_one_target" CHECK (((("post_id" IS NOT NULL) AND ("fragment_id" IS NULL)) OR (("post_id" IS NULL) AND ("fragment_id" IS NOT NULL))))
);


ALTER TABLE "public"."shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" character varying(120) NOT NULL,
    "username" character varying(50) NOT NULL,
    "email" character varying(254) NOT NULL,
    "profile_pic" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocker_id_blocked_id_key" UNIQUE ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("block_id");



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_chat_id_user_id_key" UNIQUE ("chat_id", "user_id");



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_pkey" PRIMARY KEY ("chat_members_id");



ALTER TABLE ONLY "public"."chat"
    ADD CONSTRAINT "chat_pkey" PRIMARY KEY ("chat_id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("comment_id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("token_id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_user_id_token_key" UNIQUE ("user_id", "token");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follow_id");



ALTER TABLE ONLY "public"."fragments"
    ADD CONSTRAINT "fragments_pkey" PRIMARY KEY ("fragment_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("like_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fragment_id_key" UNIQUE ("user_id", "fragment_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_post_id_key" UNIQUE ("user_id", "post_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("post_id");



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_pkey" PRIMARY KEY ("share_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



CREATE INDEX "idx_comments_fragment" ON "public"."comments" USING "btree" ("fragment_id", "created_at");



CREATE INDEX "idx_comments_post" ON "public"."comments" USING "btree" ("post_id", "created_at");



CREATE INDEX "idx_follows_follwing" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_fragments_profile" ON "public"."fragments" USING "btree" ("account_owner_id", "created_at" DESC);



CREATE INDEX "idx_likes_fragment" ON "public"."likes" USING "btree" ("fragment_id") WHERE ("fragment_id" IS NOT NULL);



CREATE INDEX "idx_likes_post" ON "public"."likes" USING "btree" ("post_id") WHERE ("post_id" IS NOT NULL);



CREATE INDEX "idx_messages_chat" ON "public"."messages" USING "btree" ("chat_id", "created_at" DESC);



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_posts_profile" ON "public"."posts" USING "btree" ("account_owner_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "trg_comments_updated" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_fragments_updated" BEFORE UPDATE ON "public"."fragments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_posts_updated" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_users_updated" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat"
    ADD CONSTRAINT "chat_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("chat_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_fragment_id_fkey" FOREIGN KEY ("fragment_id") REFERENCES "public"."fragments"("fragment_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("comment_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fragments"
    ADD CONSTRAINT "fragments_account_owner_id_fkey" FOREIGN KEY ("account_owner_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fragments"
    ADD CONSTRAINT "fragments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_fragment_id_fkey" FOREIGN KEY ("fragment_id") REFERENCES "public"."fragments"("fragment_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("chat_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_fragment_id_fkey" FOREIGN KEY ("fragment_id") REFERENCES "public"."fragments"("fragment_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("message_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_account_owner_id_fkey" FOREIGN KEY ("account_owner_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("chat_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_fragment_id_fkey" FOREIGN KEY ("fragment_id") REFERENCES "public"."fragments"("fragment_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blocks: delete own" ON "public"."blocks" FOR DELETE USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "blocks: insert own" ON "public"."blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "blocker_id"));



CREATE POLICY "blocks: read own" ON "public"."blocks" FOR SELECT USING ((("auth"."uid"() = "blocker_id") OR ("auth"."uid"() = "blocked_id")));



ALTER TABLE "public"."chat" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat: insert own" ON "public"."chat" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "chat: read if member" ON "public"."chat" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."chat_members"
  WHERE (("chat_members"."chat_id" = "chat"."chat_id") AND ("chat_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."chat_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_members: delete own" ON "public"."chat_members" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "chat_members: insert own" ON "public"."chat_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."chat"
  WHERE (("chat"."chat_id" = "chat_members"."chat_id") AND ("chat"."created_by" = "auth"."uid"())))));



CREATE POLICY "chat_members: read if member" ON "public"."chat_members" FOR SELECT USING ("public"."is_chat_member"("chat_id"));



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments: delete own" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "comments: insert own" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "comments: read all" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "comments: update own" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."device_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_tokens: delete own" ON "public"."device_tokens" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "device_tokens: insert own" ON "public"."device_tokens" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "device_tokens: read own" ON "public"."device_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "follows: delete own" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows: insert own" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows: read all" ON "public"."follows" FOR SELECT USING (true);



ALTER TABLE "public"."fragments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fragments: delete own" ON "public"."fragments" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "fragments: insert friends only" ON "public"."fragments" FOR INSERT WITH CHECK ((("auth"."uid"() = "author_id") AND ("auth"."uid"() <> "account_owner_id") AND (EXISTS ( SELECT 1
   FROM ("public"."follows" "f1"
     JOIN "public"."follows" "f2" ON ((("f1"."follower_id" = "f2"."following_id") AND ("f1"."following_id" = "f2"."follower_id"))))
  WHERE (("f1"."follower_id" = "auth"."uid"()) AND ("f1"."following_id" = "fragments"."account_owner_id"))))));



CREATE POLICY "fragments: read all" ON "public"."fragments" FOR SELECT USING (true);



CREATE POLICY "fragments: update own" ON "public"."fragments" FOR UPDATE USING (("auth"."uid"() = "author_id"));



ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "likes: delete own" ON "public"."likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "likes: insert own" ON "public"."likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "likes: read all" ON "public"."likes" FOR SELECT USING (true);



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages: insert if member" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."chat_members"
  WHERE (("chat_members"."chat_id" = "messages"."chat_id") AND ("chat_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "messages: read if member" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chat_members"
  WHERE (("chat_members"."chat_id" = "messages"."chat_id") AND ("chat_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "messages: update if member" ON "public"."messages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."chat_members"
  WHERE (("chat_members"."chat_id" = "messages"."chat_id") AND ("chat_members"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications: delete own" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications: insert system" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "notifications: read own" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications: update own" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts: delete own" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "posts: insert friends only" ON "public"."posts" FOR INSERT WITH CHECK ((("auth"."uid"() = "author_id") AND ("auth"."uid"() <> "account_owner_id") AND (EXISTS ( SELECT 1
   FROM ("public"."follows" "f1"
     JOIN "public"."follows" "f2" ON ((("f1"."follower_id" = "f2"."following_id") AND ("f1"."following_id" = "f2"."follower_id"))))
  WHERE (("f1"."follower_id" = "auth"."uid"()) AND ("f1"."following_id" = "posts"."account_owner_id"))))));



CREATE POLICY "posts: read all" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "posts: update own" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "author_id"));



ALTER TABLE "public"."shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shares: insert own" ON "public"."shares" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "shares: read own" ON "public"."shares" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users: read all" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "users: update own" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."comments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."likes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."assert_friendship"("author_id" "uuid", "profile_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_friendship_rpc"("user_a" "uuid", "user_b" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assert_friendship_rpc"("user_a" "uuid", "user_b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_friendship_rpc"("user_a" "uuid", "user_b" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_blocks_between"("user_a" "uuid", "user_b" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_friends"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_direct_chat"("user_a" "uuid", "user_b" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."find_direct_chat"("user_a" "uuid", "user_b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_direct_chat"("user_a" "uuid", "user_b" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_comment_stats"("comment_ids" "uuid"[], "current_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_followers_with_relationship"("target_user_id" "uuid", "current_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_following_with_relationship"("target_user_id" "uuid", "current_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_friends"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_home_feed"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_home_feed"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_home_feed"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inbox"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_inbox"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inbox"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_stats"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_publication_counts"("post_ids" "uuid"[], "fragment_ids" "uuid"[], "current_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_relationship_status"("current_user_id" "uuid", "target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_unread_messages"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_unread_messages"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_unread_messages"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_counts"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_counts"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_counts"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_with_relationship"("user_ids" "uuid"[], "current_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_chat_member"("p_chat_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_chat_member"("p_chat_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_chat_member"("p_chat_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text", "current_user_id" "uuid", "result_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_like"("p_user_id" "uuid", "p_post_id" "uuid", "p_fragment_id" "uuid") TO "service_role";


















GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."chat" TO "anon";
GRANT ALL ON TABLE "public"."chat" TO "authenticated";
GRANT ALL ON TABLE "public"."chat" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."chat_members" TO "anon";
GRANT ALL ON TABLE "public"."chat_members" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_members" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."device_tokens" TO "anon";
GRANT ALL ON TABLE "public"."device_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."device_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."fragments" TO "anon";
GRANT ALL ON TABLE "public"."fragments" TO "authenticated";
GRANT ALL ON TABLE "public"."fragments" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."shares" TO "anon";
GRANT ALL ON TABLE "public"."shares" TO "authenticated";
GRANT ALL ON TABLE "public"."shares" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

revoke select on table "public"."blocks" from "anon";

revoke select on table "public"."chat" from "anon";

revoke select on table "public"."chat_members" from "anon";

revoke select on table "public"."device_tokens" from "anon";

revoke select on table "public"."messages" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke select on table "public"."shares" from "anon";

alter table "public"."device_tokens" drop constraint "device_tokens_platform_check";

alter table "public"."posts" drop constraint "posts_media_type_check";

alter table "public"."device_tokens" add constraint "device_tokens_platform_check" CHECK (((platform)::text = ANY ((ARRAY['ios'::character varying, 'android'::character varying, 'web'::character varying])::text[]))) not valid;

alter table "public"."device_tokens" validate constraint "device_tokens_platform_check";

alter table "public"."posts" add constraint "posts_media_type_check" CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[]))) not valid;

alter table "public"."posts" validate constraint "posts_media_type_check";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "post images owner delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'post-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "post images owner update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'post-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "post images owner upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'post-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "post images public read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'post-images'::text));



  create policy "posts pics owner upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'post-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "profile pics owner delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'profile-pictures'::text) AND (name = ((auth.uid())::text || '.jpg'::text))));



  create policy "profile pics owner update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'profile-pictures'::text) AND (name = ((auth.uid())::text || '.jpg'::text))));



  create policy "profile pics owner upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'profile-pictures'::text) AND (name = ((auth.uid())::text || '.jpg'::text))));



  create policy "profile pics public read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profile-pictures'::text));



  create policy "profile pix owner upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



