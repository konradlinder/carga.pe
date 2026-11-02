-- Permite editar tu agencia y su tema de colores desde el panel (pestaña "Mi cuenta").
-- Ejecuta este archivo completo en Supabase > SQL Editor.
-- ANTES de ejecutarlo, reemplaza TU_CORREO@ejemplo.com por el mismo correo con el que inicias sesión (2 veces).

alter table public.agencias
  add column if not exists tema text not null default 'azul'
  check (tema in ('azul','verde','naranja','violeta','grafito'));

create policy "agencias_admin" on public.agencias
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'TU_CORREO@ejemplo.com')
  with check ((auth.jwt() ->> 'email') = 'TU_CORREO@ejemplo.com');
