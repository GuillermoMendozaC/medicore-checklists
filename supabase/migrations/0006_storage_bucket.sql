-- Crear el bucket de almacenamiento 'checklist-media' si no existe
insert into storage.buckets (id, name, public)
values ('checklist-media', 'checklist-media', true)
on conflict (id) do nothing;
