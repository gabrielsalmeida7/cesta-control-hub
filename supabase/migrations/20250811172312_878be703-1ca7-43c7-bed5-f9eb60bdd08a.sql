-- Ensure bootstrap_admin function exists
CREATE OR REPLACE FUNCTION public.bootstrap_admin(admin_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- If an admin already exists, do nothing
  if exists (select 1 from public.profiles where role = 'admin') then
    return false;
  end if;

  -- Promote the profile with the given email to admin
  update public.profiles
    set role = 'admin', updated_at = now()
  where email = admin_email;

  return found; -- true if a row was updated
end;
$function$;