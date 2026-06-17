alter table profiles drop constraint profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin','tecnico','cliente','pendiente'));
alter table profiles alter column role set default 'pendiente';

-- Crea automáticamente el perfil correspondiente cuando se crea un usuario
-- en auth.users. Si trae la marca signup_type='cliente' en la metadata
-- (viene del formulario público), crea también la fila en clients y deja
-- role='cliente' directo. Cualquier otro caso (usuarios creados a mano por
-- el admin desde el dashboard de Supabase) queda en 'pendiente' hasta que
-- el admin le asigne el rol real desde UserRoles.jsx.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$

declare
  new_client_id uuid;
begin
  if new.raw_user_meta_data ->> 'signup_type' = 'cliente' then
    insert into public.clients (name, contact_email, contact_phone)
    values (
      new.raw_user_meta_data ->> 'clinic_name',
      new.email,
      new.raw_user_meta_data ->> 'contact_phone'
    )
    returning id into new_client_id;

    insert into public.profiles (id, full_name, role, client_id)
    values (new.id, new.raw_user_meta_data ->> 'full_name', 'cliente', new_client_id);
  else
    insert into public.profiles (id, full_name, role)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'pendiente');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Blindaje: un usuario no puede cambiar su propio role ni client_id salvo
-- que ya sea admin. Así se evita que alguien, por ejemplo desde la consola
-- del navegador, intente un update directo a su propio perfil para
-- ponerse role='admin'.
create or replace function public.lock_role_for_self_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id and old.role <> 'admin' then
    new.role := old.role;
    new.client_id := old.client_id;
  end if;
  return new;
end;
$$;

create trigger trg_lock_role_for_self_update
before update on public.profiles
for each row execute function public.lock_role_for_self_update();
