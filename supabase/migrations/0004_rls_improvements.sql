-- 1. Helper functions with security definer to bypass RLS recursion

create or replace function public.get_my_role()
returns text as $$
begin
  return (
    select role from public.profiles
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

create or replace function public.get_my_client_id()
returns uuid as $$
begin
  return (
    select client_id from public.profiles
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;


-- 2. Drop and recreate policies with secure helpers to avoid subqueries in RLS checking

-- Profiles Policies
drop policy if exists "Ver perfil propio" on public.profiles;
drop policy if exists "Admins ven todos los perfiles" on public.profiles;
drop policy if exists "actualizar perfil propio" on public.profiles;

create policy "Ver perfil propio" on public.profiles 
  for select using (id = auth.uid());
create policy "Admins ven todos los perfiles" on public.profiles 
  for select using (public.es_admin());
create policy "actualizar perfil propio" on public.profiles 
  for update using (id = auth.uid());
create policy "Admins actualizan todos los perfiles" on public.profiles 
  for update using (public.es_admin());


-- Equipment Categories Policies
drop policy if exists "escritura admin" on public.equipment_categories;
create policy "escritura admin" on public.equipment_categories 
  for all using (public.es_admin());


-- Equipment Policies
drop policy if exists "lectura equipos segun rol" on public.equipment;
drop policy if exists "escritura admin" on public.equipment;
drop policy if exists "clientes insertan sus propios equipos" on public.equipment;
drop policy if exists "clientes actualizan sus propios equipos" on public.equipment;

create policy "lectura equipos segun rol" on public.equipment 
  for select using (
    public.get_my_role() in ('admin','tecnico')
    or client_id = public.get_my_client_id()
  );
create policy "escritura admin" on public.equipment 
  for all using (public.es_admin());
create policy "clientes insertan sus propios equipos" on public.equipment 
  for insert with check (
    public.get_my_role() = 'cliente'
    and client_id = public.get_my_client_id()
  );
create policy "clientes actualizan sus propios equipos" on public.equipment 
  for update using (
    public.get_my_role() = 'cliente'
    and client_id = public.get_my_client_id()
  );


-- Checklist Templates Policies
drop policy if exists "escritura admin" on public.checklist_templates;
create policy "escritura admin" on public.checklist_templates 
  for all using (public.es_admin());


-- Checklist Template Items Policies
drop policy if exists "escritura admin" on public.checklist_template_items;
create policy "escritura admin" on public.checklist_template_items 
  for all using (public.es_admin());


-- Clients Policies (Technicians need select access to see client details)
drop policy if exists "clientes ven su propio registro, admin ve todos" on public.clients;
drop policy if exists "solo admin actualiza clientes" on public.clients;

create policy "clientes, admins y tecnicos ven clientes" on public.clients 
  for select using (
    id = public.get_my_client_id()
    or public.get_my_role() in ('admin', 'tecnico')
  );
create policy "solo admin actualiza clientes" on public.clients 
  for update using (public.es_admin());


-- Maintenance Checklists Policies
drop policy if exists "checklists propios o admin" on public.maintenance_checklists;
drop policy if exists "clientes ven checklists de su equipo" on public.maintenance_checklists;

create policy "checklists propios o admin" on public.maintenance_checklists 
  for all using (
    technician_id = auth.uid() 
    or public.es_admin()
  );
create policy "clientes ven checklists de su equipo" on public.maintenance_checklists 
  for select using (
    equipment_id in (select id from public.equipment where client_id = public.get_my_client_id())
  );


-- Checklist Responses Policies
drop policy if exists "respuestas via checklist" on public.checklist_responses;
drop policy if exists "clientes ven respuestas de sus checklists" on public.checklist_responses;

create policy "respuestas via checklist" on public.checklist_responses 
  for all using (
    exists (
      select 1 from public.maintenance_checklists mc
      where mc.id = checklist_id
      and (mc.technician_id = auth.uid() or public.es_admin())
    )
  );
create policy "clientes ven respuestas de sus checklists" on public.checklist_responses 
  for select using (
    exists (
      select 1 from public.maintenance_checklists mc
      join public.equipment e on e.id = mc.equipment_id
      where mc.id = checklist_id
      and e.client_id = public.get_my_client_id()
    )
  );


-- Appointments Policies
drop policy if exists "citas segun rol" on public.appointments;

create policy "citas segun rol" on public.appointments 
  for all using (
    client_id = public.get_my_client_id()
    or public.es_admin()
    or assigned_technician_id = auth.uid()
  );
