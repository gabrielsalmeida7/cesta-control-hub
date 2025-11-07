
-- Permitir que administradores atualizem qualquer perfil
create policy "Admins can update any profile"
on public.profiles
for update
to authenticated
using (get_user_role(auth.uid()) = 'admin'::user_role)
with check (get_user_role(auth.uid()) = 'admin'::user_role);

-- Permitir que administradores deletem perfis (opcional; útil se quisermos permitir exclusão)
create policy "Admins can delete any profile"
on public.profiles
for delete
to authenticated
using (get_user_role(auth.uid()) = 'admin'::user_role);
