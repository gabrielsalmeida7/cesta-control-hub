-- Fix linter: set search_path on functions

-- update_family_blocking
CREATE OR REPLACE FUNCTION public.update_family_blocking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Atualizar o status de bloqueio da família
  UPDATE public.families 
  SET 
    is_blocked = true,
    blocked_until = NEW.delivery_date + (NEW.blocking_period_days || ' days')::INTERVAL,
    blocked_by_institution_id = NEW.institution_id,
    block_reason = 'Recebeu cesta básica',
    updated_at = now()
  WHERE id = NEW.family_id;
  
  RETURN NEW;
END;
$function$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'institution')
  );
  RETURN NEW;
END;
$function$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;