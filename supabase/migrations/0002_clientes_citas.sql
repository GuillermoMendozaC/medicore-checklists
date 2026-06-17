create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  contact_phone text,
  created_at timestamptz default now()
);

alter table profiles drop constraint profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin','tecnico','cliente'));
alter table profiles add column client_id uuid references clients(id);
alter table profiles add constraint profiles_cliente_requiere_client
  check (role <> 'cliente' or client_id is not null);

alter table equipment add column client_id uuid references clients(id);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) not null,
  equipment_id uuid references equipment(id),
  requested_date date not null,
  description text,
  status text check (status in ('pendiente','asignada','completada','cancelada')) default 'pendiente',
  assigned_technician_id uuid references profiles(id),
  confirmed_date date,
  created_at timestamptz default now()
);

alter table maintenance_checklists add column appointment_id uuid references appointments(id);

alter table clients enable row level security;
alter table appointments enable row level security;

create policy "clientes ven su propio registro, admin ve todos" on clients for select using (
  id = (select client_id from profiles where id = auth.uid())
  or (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "permitir crear clientes a autenticados" on clients for insert with check (
  auth.role() = 'authenticated'
);
create policy "solo admin actualiza clientes" on clients for update using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- IMPORTANTE: la política anterior de equipment ("lectura autenticados") dejaba
-- ver TODOS los equipos a cualquier usuario logueado. Hay que reemplazarla
-- ahora que existen clientes externos:
drop policy "lectura autenticados" on equipment;
create policy "lectura equipos segun rol" on equipment for select using (
  (select role from profiles where id = auth.uid()) in ('admin','tecnico')
  or client_id = (select client_id from profiles where id = auth.uid())
);

-- Acceso de solo lectura para clientes sobre los checklists de SUS equipos
-- (se suma a la política existente "checklists propios o admin", no la reemplaza)
create policy "clientes ven checklists de su equipo" on maintenance_checklists for select using (
  equipment_id in (select id from equipment where client_id = (select client_id from profiles where id = auth.uid()))
);
create policy "clientes ven respuestas de sus checklists" on checklist_responses for select using (
  exists (
    select 1 from maintenance_checklists mc
    join equipment e on e.id = mc.equipment_id
    where mc.id = checklist_id
    and e.client_id = (select client_id from profiles where id = auth.uid())
  )
);

create policy "citas segun rol" on appointments for all using (
  client_id = (select client_id from profiles where id = auth.uid())
  or (select role from profiles where id = auth.uid()) = 'admin'
  or assigned_technician_id = auth.uid()
);

-- Permitir a usuarios autenticados crear su propio perfil durante el registro
create policy "usuarios crean su propio perfil" on profiles for insert with check (id = auth.uid());
