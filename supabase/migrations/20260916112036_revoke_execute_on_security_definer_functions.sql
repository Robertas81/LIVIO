-- Revoke EXECUTE on SECURITY DEFINER trigger functions from anon and authenticated.
-- These are internal trigger functions that should never be called via the REST API.
-- They run automatically on INSERT via triggers; direct RPC access is unnecessary.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_comment_created_by() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_created_by() FROM anon, authenticated;