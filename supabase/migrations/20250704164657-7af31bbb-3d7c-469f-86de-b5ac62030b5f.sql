-- Criar perfis de usuário de teste para corresponder aos dados de bypass

-- Perfil Admin de teste
INSERT INTO public.profiles (id, email, full_name, role, institution_id) VALUES
('11111111-2222-4333-8444-555555555555', 'admin@araguari.mg.gov.br', 'Administrador Sistema', 'admin', NULL);

-- Perfil Instituição de teste (usando o ID real da APAE)
INSERT INTO public.profiles (id, email, full_name, role, institution_id) VALUES
('22222222-3333-4444-8555-666666666666', 'instituicao@casesperanca.org.br', 'Responsável Instituição', 'institution', 'b9e546e9-6443-460c-a6e1-d8d86efb0971');