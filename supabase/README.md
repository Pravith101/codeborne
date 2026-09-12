# Supabase migrations

This project keeps database changes in `supabase/migrations` so the schema is reproducible.

For CP02, open the Supabase project's **SQL Editor**, paste and run `migrations/202609130001_create_profiles.sql`, then enable Email/Password sign-in in the project's Authentication settings. The migration creates `public.profiles`, enables RLS, and uses an `auth.users` trigger to securely create each new player's profile with default values.

Use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` for the browser client. Never add a service-role key to this project.
