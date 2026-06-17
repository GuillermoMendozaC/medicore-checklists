-- Permitir que cualquier usuario autenticado pueda leer perfiles de usuario
-- Esto corrige que el cliente no pueda ver el nombre del técnico asignado en su portal.
drop policy if exists "Ver perfil propio" on public.profiles;
drop policy if exists "Admins ven todos los perfiles" on public.profiles;

create policy "Perfiles legibles por autenticados" on public.profiles
  for select using (auth.role() = 'authenticated');
