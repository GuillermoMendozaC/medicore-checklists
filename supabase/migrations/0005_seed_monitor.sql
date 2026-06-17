-- 1. Insertar la categoría de equipo para Monitores si no existe
insert into public.equipment_categories (id, name)
values ('c22c070c-2de4-4386-9309-8d97e88f124e', 'Monitores de Signos Vitales')
on conflict (id) do nothing;

-- 2. Insertar la plantilla del checklist
insert into public.checklist_templates (id, category_id, name, frequency)
values (
  'd99c070c-2de4-4386-9309-8d97e88f124f', 
  'c22c070c-2de4-4386-9309-8d97e88f124e', 
  'Mantenimiento Preventivo de Monitor Multiparámetros', 
  'mensual'
)
on conflict (id) do nothing;

-- 3. Insertar los ítems de la plantilla
insert into public.checklist_template_items (id, template_id, label, item_type, is_required, sort_order)
values
  ('e11c070c-2de4-4386-9309-8d97e88f1240', 'd99c070c-2de4-4386-9309-8d97e88f124f', 'Inspección visual de carcasa, pantalla y teclas', 'boolean', true, 1),
  ('e11c070c-2de4-4386-9309-8d97e88f1241', 'd99c070c-2de4-4386-9309-8d97e88f124f', 'Integridad de cables de alimentación, tierra y enchufe', 'boolean', true, 2),
  ('e11c070c-2de4-4386-9309-8d97e88f1242', 'd99c070c-2de4-4386-9309-8d97e88f124f', 'Prueba de encendido y verificación de autodiagnóstico', 'boolean', true, 3),
  ('e11c070c-2de4-4386-9309-8d97e88f1243', 'd99c070c-2de4-4386-9309-8d97e88f124f', 'Prueba de alarmas (límites altos/bajos y silencio acústico)', 'boolean', true, 4),
  ('e11c070c-2de4-4386-9309-8d97e88f1244', 'd99c070c-2de4-4386-9309-8d97e88f124f', 'Medición de voltaje de batería interna (V)', 'numero', true, 5),
  ('e11c070c-2de4-4386-9309-8d97e88f1245', 'd99c070c-2de4-4386-9309-8d97e88f124f', 'Estado de accesorios (ECG, PNI, SpO2, Temperatura) (Buen Estado / Regular / Defectuoso)', 'seleccion', true, 6),
  ('e11c070c-2de4-4386-9309-8d97e88f1246', 'd99c070c-2de4-4386-9309-8d97e88f124f', 'Limpieza externa, desinfección y retiro de residuos', 'boolean', true, 7),
  ('e11c070c-2de4-4386-9309-8d97e88f1247', 'd99c070c-2de4-4386-9309-8d97e88f124f', 'Observaciones y comentarios del mantenimiento técnico', 'texto', false, 8)
on conflict (id) do nothing;
