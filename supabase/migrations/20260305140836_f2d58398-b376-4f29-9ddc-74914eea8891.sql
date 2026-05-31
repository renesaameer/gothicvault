-- Fix newsletter upsert: allow anonymous users to INSERT with ON CONFLICT (upsert needs SELECT too)
-- Create an RPC function for newsletter subscription to handle upsert safely
CREATE OR REPLACE FUNCTION public.subscribe_newsletter(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO newsletter_subscribers (email)
  VALUES (_email)
  ON CONFLICT (email) DO NOTHING;
END;
$$;
