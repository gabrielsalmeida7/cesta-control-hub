
-- Passo 3: Triggers e Funções Automáticas (Corrigido)

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se o trigger já existe antes de criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;

-- Função para atualizar o bloqueio da família automaticamente após uma entrega
CREATE OR REPLACE FUNCTION public.update_family_blocking()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se o trigger já existe antes de criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_delivery_created'
    ) THEN
        CREATE TRIGGER on_delivery_created
          AFTER INSERT ON public.deliveries
          FOR EACH ROW EXECUTE PROCEDURE public.update_family_blocking();
    END IF;
END $$;

-- Função para atualizar o timestamp updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se os triggers de updated_at já existem antes de criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_institutions_updated_at'
    ) THEN
        CREATE TRIGGER update_institutions_updated_at 
          BEFORE UPDATE ON public.institutions 
          FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_families_updated_at'
    ) THEN
        CREATE TRIGGER update_families_updated_at 
          BEFORE UPDATE ON public.families 
          FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at 
          BEFORE UPDATE ON public.profiles 
          FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
    END IF;
END $$;
