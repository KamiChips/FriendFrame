select
    trigger_name,
    event_object_schema,
    event_object_table
from information_schema.triggers
where trigger_name ilike '%user%';