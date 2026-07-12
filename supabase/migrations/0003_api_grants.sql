-- ---------------------------------------------------------------------------
-- API role grants for tables created via SQL migrations.
-- Supabase projects with restricted Data API settings may not auto-grant
-- access to migration-created tables; without these, INSERT can succeed while
-- SELECT/UPDATE/DELETE on related tables silently return zero rows.
-- ---------------------------------------------------------------------------

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;

grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to authenticated;
