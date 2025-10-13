# Checklist: Cajeros por Administrador (Supabase Realtime + Tabla Pivot)

## Objetivo
Asegurar que cada administrador vea **solo sus cajeros** en la vista, usando **Realtime de Supabase** y la tabla pivot `cajerosxadministradores`. Los **CRUD** continúan via **Flask**.

## Prerrequisitos
- [🟢] Variables de entorno definidas
  - [🟢] `VITE_SUPABASE_URL`
  - [🟢] `VITE_SUPABASE_ANON_KEY`
  - [🟢] `VITE_API_BASE_URL`
- [🟢] Dependencia instalada en frontend
  - [🟢] `@supabase/supabase-js`

## Estructura de Datos (Supabase)
- [ ] Crear tabla pivot (PK compuesta y FKs)
  - [🟢] `create table public.cajerosxadministradores (
      admin_id integer not null references public.administradores(id) on delete cascade,
      cajero_id integer not null references public.cajeros(id) on delete cascade,
      primary key (admin_id, cajero_id)
    );`
- [ ] (Opcional) Vincular administradores con usuarios de Supabase Auth
  - [ ] `alter table public.administradores add column auth_user_id uuid unique;`
- [ ] Habilitar Realtime
  - [ ] `alter publication supabase_realtime add table public.cajeros;`
  - [ ] `alter publication supabase_realtime add table public.cajerosxadministradores;`
- [ ] Activar RLS
  - [ ] `alter table public.cajeros enable row level security;`
  - [ ] `alter table public.cajerosxadministradores enable row level security;`
- [ ] Policies (elige según tu modelo)
  - [ ] Lectura por usuario autenticado:
    - [ ] `create policy "read cajeros by admin link" on public.cajeros for select to authenticated using (
            exists (
              select 1 from public.cajerosxadministradores cx
              join public.administradores a on a.id = cx.admin_id
              where cx.cajero_id = cajeros.id and a.auth_user_id = auth.uid()
            )
          );`
  - [ ] Lectura para anon (solo pruebas; menos seguro):
    - [ ] `create policy "allow read for anon" on public.cajeros for select to anon using (true);`

## Frontend (Configuración)
- [ ] Cliente Supabase
  - [ ] Archivo `services/supabase.ts` crea el cliente con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  - [ ] Importar `supabase` en `components/Cajeros.tsx`.
- [ ] Tipos y normalización de datos
  - [ ] `types.Cajero` usa `conteoDia` (no `conteodia`) y `estadolinea` booleano.
  - [ ] Normalizar payload Realtime: `conteoDia = payload.conteoDia ?? payload.conteodia ?? 0`.
- [ ] CRUD Flask
  - [ ] Mantener carga inicial y edición via `services/api.ts`.

## Frontend (Suscripción y Filtros)
- [ ] Suscribirse a cambios en `cajerosxadministradores` filtrando por `admin_id`.
- [ ] Construir lista de IDs y suscribirse a `cajeros` con filtro `id in (...)`.
- [ ] Re-crear suscripción cuando cambie la asignación en la pivot.

## Verificación
- [ ] Conexión websocket activa (DevTools → Network).
- [ ] Cambios en `cajeros` reflejados en tiempo real.
- [ ] Cada admin ve solo sus cajeros asignados desde la pivot.

## Notas
- Si no usas Supabase Auth, considera al menos una policy restrictiva por `admin_id`.
- CRUD siguen en Flask; Realtime es directo Supabase ↔ Frontend.