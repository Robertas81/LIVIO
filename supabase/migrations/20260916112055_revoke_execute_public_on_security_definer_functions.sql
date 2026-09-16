-- Revoke EXECUTE from PUBLIC on SECURITY DEFINER trigger functions.
-- anon and authenticated inherit from PUBLIC, so revoking from them alone is insufficient.
-- These are internal trigger functions that run automatically; they must not be callable via REST.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.populate_comment_created_by() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.populate_created_by() FROM PUBLIC;