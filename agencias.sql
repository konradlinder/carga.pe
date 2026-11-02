-- Datos editables de cada agencia (título, contacto, etc.)
-- Ejecuta este archivo completo en Supabase > SQL Editor.
-- Después edítalos en Table Editor > agencias (haz clic en una celda, cambia el texto y guarda).
-- OJO: todo lo que guardes en esta tabla es público (lo lee la página). No pongas datos privados aquí.

create table public.agencias (
  id         bigint generated always as identity primary key,
  slug       text not null unique,          -- identifica a la agencia en la dirección: agencia-ejemplo.html?a=andes-cargo
  activa     boolean not null default true, -- si la desmarcas, la página usa los datos de ejemplo
  nombre     text not null,                 -- nombre de la agencia (encabezado, pestaña y pie de página)
  titulo     text,                          -- título grande de la portada; encierra una palabra entre *asteriscos* para ponerla en azul
  bajada     text,                          -- texto debajo del título
  whatsapp   text,                          -- con código de país, solo números: 51999999999
  telefono   text,
  email      text,
  direccion  text,
  horario    text,
  tema       text not null default 'azul' check (tema in ('azul','verde','naranja','violeta','grafito'))
);

alter table public.agencias enable row level security;

-- Solo tu correo puede EDITAR (reemplaza TU_CORREO@ejemplo.com por el correo con el que inicias sesión).
create policy "agencias_admin" on public.agencias
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'TU_CORREO@ejemplo.com')
  with check ((auth.jwt() ->> 'email') = 'TU_CORREO@ejemplo.com');

-- Cualquiera puede LEER las agencias activas (la página pública). Nadie puede escribir desde la web;
-- tú editas desde el panel de Supabase.
create policy "agencias_publicas" on public.agencias
  for select to anon, authenticated using (activa);

insert into public.agencias (slug, nombre, titulo, bajada, whatsapp, telefono, email, direccion, horario) values
  ('andes-cargo', 'Andes Cargo Express', 'Tu carga, de Lima a todo el *Perú*',
   'Transporte terrestre de carga con recojo a domicilio, salidas diarias y seguimiento de tu envío en cada etapa.',
   '51999999999', '+51 999 999 999', 'ventas@ejemplo.pe', 'Av. Ejemplo 123, Lima', 'Lunes a sábado · 8:00 a 18:00');
