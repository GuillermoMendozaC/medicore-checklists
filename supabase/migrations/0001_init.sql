create table profiles (
  id uuid references auth.users primary key,
  full_name text not null,
  role text check (role in ('admin', 'tecnico')) default 'tecnico',
  created_at timestamptz default now()
);

create table equipment_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references equipment_categories(id),
  name text not null,
  brand text,
  model text,
  serial_number text,
  location text,
  status text check (status in ('activo','inactivo','en_reparacion')) default 'activo',
  created_at timestamptz default now()
);

create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references equipment_categories(id),
  name text not null,
  frequency text check (frequency in ('semanal','mensual','trimestral','anual'))
);

create table checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references checklist_templates(id),
  label text not null,
  item_type text check (item_type in ('boolean','texto','numero','seleccion')),
  is_required boolean default true,
  sort_order int default 0
);

create table maintenance_checklists (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references equipment(id),
  template_id uuid references checklist_templates(id),
  technician_id uuid references profiles(id),
  scheduled_date date,
  completed_at timestamptz,
  status text check (status in ('pendiente','en_progreso','completado')) default 'pendiente',
  general_notes text,
  signature_url text,
  created_at timestamptz default now()
);

create table checklist_responses (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid references maintenance_checklists(id),
  template_item_id uuid references checklist_template_items(id),
  value text,
  notes text,
  photo_url text
);

-- RLS: habilitar en todas las tablas
alter table profiles enable row level security;
alter table equipment_categories enable row level security;
alter table equipment enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_template_items enable row level security;
alter table maintenance_checklists enable row level security;
alter table checklist_responses enable row level security;

-- Lectura: cualquier usuario autenticado puede leer catálogos y equipos
create policy "lectura autenticados" on equipment_categories for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on equipment for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on checklist_templates for select using (auth.role() = 'authenticated');
create policy "lectura autenticados" on checklist_template_items for select using (auth.role() = 'authenticated');

-- Escritura de catálogos: solo admin (verificando profiles.role)
create policy "escritura admin" on equipment_categories for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "escritura admin" on equipment for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "escritura admin" on checklist_templates for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "escritura admin" on checklist_template_items for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Checklists: el técnico ve y edita los suyos, el admin ve y edita todos
create policy "checklists propios o admin" on maintenance_checklists for all using (
  technician_id = auth.uid() or (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "respuestas via checklist" on checklist_responses for all using (
  exists (
    select 1 from maintenance_checklists mc
    where mc.id = checklist_id
    and (mc.technician_id = auth.uid() or (select role from profiles where id = auth.uid()) = 'admin')
  )
);

-- Función helper para verificar si es admin (evita recursión infinita en RLS)
create or replace function public.es_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Perfiles: cada usuario ve y edita el suyo, admin ve todos
create policy "Ver perfil propio" on profiles for select using (id = auth.uid());
create policy "Admins ven todos los perfiles" on profiles for select using (public.es_admin());
create policy "actualizar perfil propio" on profiles for update using (id = auth.uid());

-- Políticas de Storage: Permitir subida y lectura en el bucket 'checklist-media'
create policy "Permitir subida a autenticados" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'checklist-media');

create policy "Permitir lectura publica" on storage.objects
  for select
  using (bucket_id = 'checklist-media');



