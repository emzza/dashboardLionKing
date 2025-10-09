# Documentación de Arquitectura - Dashboard Lion King

## Resumen del Proyecto

**Dashboard Lion King** es una aplicación web desarrollada en React con TypeScript que permite gestionar cajeros, macros y administradores. Actualmente utiliza Supabase como backend y base de datos, pero se migrará a una API desarrollada en Python con Flask.

## Arquitectura Actual

### Stack Tecnológico
- **Frontend**: React 19.1.1 + TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS (CDN)
- **Backend Actual**: Supabase (PostgreSQL + API REST + Realtime)
- **Deployment**: Serve (para producción)

### Estructura de Archivos

```
dashboardLionKing/
├── components/                 # Componentes React
│   ├── Administradores.tsx    # Gestión de administradores
│   ├── Cajeros.tsx           # Gestión de cajeros
│   ├── Dashboard.tsx         # Dashboard principal
│   ├── Layout.tsx            # Layout wrapper
│   ├── Login.tsx             # Componente de autenticación
│   ├── Macros.tsx            # Gestión de macros CBU
│   ├── Modal.tsx             # Componente modal reutilizable
│   ├── Notification.tsx      # Sistema de notificaciones
│   ├── Sidebar.tsx           # Barra lateral de navegación
│   ├── Spinner.tsx           # Componente de carga
│   └── ui/
│       └── ButtonSideBar.tsx # Botón para toggle del sidebar
├── services/
│   └── supabase.ts           # Servicios de conexión a Supabase
├── App.tsx                   # Componente raíz
├── constants.tsx             # Iconos SVG y constantes
├── types.ts                  # Definiciones de tipos TypeScript
├── index.tsx                 # Punto de entrada
├── package.json              # Dependencias y scripts
└── vite.config.ts           # Configuración de Vite
```

## Modelos de Datos

### Administrador
```typescript
interface Administrador {
  id: number;
  nombre: string;
  contrasena: string;
  permisoAdmin: boolean;
}
```

### Cajero
```typescript
interface Cajero {
  id: number;
  nombre: string;
  estadolinea: boolean;
  numerotelefono: string;
  idgrupo: string;
  conteo: number;
  maxconteo: number;
  conteoDia: number;
}
```

### Macro
```typescript
interface Macro {
  id: number;
  'cbu100%': string;
  'cbu90%': string;
}
```

## Funcionalidades Principales

### 1. Autenticación
- **Componente**: `Login.tsx`
- **Función**: Verificación de credenciales de administrador
- **Servicio**: `signIn(nombre, contrasena)`

### 2. Gestión de Cajeros
- **Componente**: `Cajeros.tsx`
- **Funcionalidades**:
  - Listar cajeros asignados al administrador
  - Editar información de cajeros
  - Crear nuevos cajeros
  - Filtros por nombre, teléfono y estado
  - Actualizaciones en tiempo real
- **Servicios**:
  - `fetchCajerosForAdmin(adminId)`
  - `updateCajero(id, updates)`
  - `createCajero(newCajero)`
  - `linkCajeroToAdmin(cajeroId, adminId)`

### 3. Gestión de Administradores
- **Componente**: `Administradores.tsx`
- **Funcionalidades**:
  - Listar todos los administradores
  - Editar administradores existentes
  - Crear nuevos administradores
  - Asignar cajeros a administradores
- **Servicios**:
  - `fetchAllAdmins()`
  - `updateAdmin(id, updates)`
  - `createAdmin(newAdmin)`
  - `updateAdminCajeroRelations(adminId, cajeroIds)`

### 4. Gestión de Macros
- **Componente**: `Macros.tsx`
- **Funcionalidades**:
  - Visualizar y editar CBUs (90% y 100%)
  - Actualización de valores macro
- **Servicios**:
  - `fetchMacro(id)`
  - `updateMacro(id, updates)`

## Servicios de Supabase Actuales

### Autenticación
- `signIn(nombre, contrasena)`: Verifica credenciales

### Operaciones CRUD
- **Cajeros**: fetch, update, create, fetchAll
- **Administradores**: fetchAll, update, create
- **Macros**: fetch, update
- **Relaciones**: linkCajeroToAdmin, updateAdminCajeroRelations

### Tiempo Real
- `subscribeToCajeroChanges()`: Suscripción a cambios en cajeros
- `subscribeToRelationChanges()`: Suscripción a cambios en relaciones

## Flujo de Navegación

1. **Login** → Verificación de credenciales
2. **Dashboard** → Vista principal con sidebar
3. **Sidebar** → Navegación entre secciones:
   - Cajeros (vista por defecto)
   - Macros
   - Administradores (solo si permisoAdmin = true)

## Gestión de Estado

### Estado Local (useState)
- Datos de formularios
- Estados de carga (loading, saving)
- Notificaciones
- Modales abiertos/cerrados

### Persistencia
- **SessionStorage**: Información del administrador logueado
- **Supabase**: Persistencia de todos los datos

## Sistema de Notificaciones

Tipos de notificación:
- `SUCCESS`: Operaciones exitosas
- `ERROR`: Errores en operaciones
- `INFO`: Información general

## Permisos y Seguridad

- **Administradores básicos**: Solo pueden ver y gestionar sus cajeros asignados
- **Super administradores** (`permisoAdmin: true`): Acceso completo a la gestión de administradores

## Dependencias Principales

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.58.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "serve": "^14.2.3"
  }
}
```

## Configuración de Entorno

Variables requeridas:
- `VITE_SUPABASE_URL_KEY`: URL de la instancia de Supabase
- `VITE_SUPABASE_API_KEY`: Clave API de Supabase

## Puntos de Migración Identificados

### Servicios a Migrar
1. **Autenticación**: `signIn` → `iniciar_sesion_administrador`
2. **Cajeros**: `fetchCajerosForAdmin` → `obtener_cajeros_por_administrador`
3. **Macros**: `fetchMacro`, `updateMacro` → `obtener_cbus_macro`, `modificar_cbus_macro`
4. **Administradores**: `fetchAllAdmins`, `updateAdmin` → `obtener_todos_administradores`, `modificar_administrador_por_id`

### Funcionalidades Sin Equivalente en API Flask
- `fetchAllCajeros`
- `createCajero`
- `createAdmin`
- `linkCajeroToAdmin`
- `updateAdminCajeroRelations`
- Suscripciones en tiempo real

### Cambios Requeridos
1. Reemplazar cliente Supabase por cliente HTTP
2. Adaptar respuestas JSON de Flask
3. Implementar polling para simular tiempo real
4. Manejar errores HTTP vs errores de Supabase
5. Actualizar configuración de entorno