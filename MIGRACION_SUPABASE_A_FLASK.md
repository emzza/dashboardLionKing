# Migración de Supabase a Flask API

## Resumen de la Migración

Este documento describe la migración completa del frontend React desde el uso directo de Supabase hacia el consumo de una API Flask que actúa como intermediario.

## Cambios Realizados

### 1. Nuevo Servicio API (`services/api.ts`)

Se creó un nuevo servicio que reemplaza completamente `services/supabase.ts`:

#### Funciones Implementadas:
- ✅ `signIn()` - Autenticación de administradores
- ✅ `fetchMacro()` - Obtener valores de CBU macro
- ✅ `updateMacro()` - Actualizar valores de CBU macro
- ✅ `fetchCajerosForAdmin()` - Obtener cajeros por administrador
- ✅ `updateCajero()` - Actualizar datos de cajero
- ✅ `fetchAllAdmins()` - Obtener todos los administradores
- ✅ `updateAdmin()` - Actualizar datos de administrador
- ✅ `getAdminIdByName()` - Obtener ID de administrador por nombre
- ✅ `getCajeroIdByName()` - Obtener ID de cajero por nombre

#### Funciones No Disponibles en Flask API:
- ❌ `fetchAllCajeros()` - No hay endpoint equivalente
- ❌ `createCajero()` - No hay endpoint equivalente
- ❌ `linkCajeroToAdmin()` - No hay endpoint equivalente
- ❌ `updateAdminCajeroRelations()` - No hay endpoint equivalente
- ❌ `createAdmin()` - No hay endpoint equivalente

#### Suscripciones en Tiempo Real:
- ❌ `subscribeToCajeroChanges()` - Reemplazado con polling
- ❌ `subscribeToRelationChanges()` - Reemplazado con polling

### 2. Actualización de Componentes

#### `components/Login.tsx`
- ✅ Actualizado import de `services/supabase` a `services/api`
- ✅ Mantiene la misma funcionalidad

#### `components/Macros.tsx`
- ✅ Actualizado import de `services/supabase` a `services/api`
- ✅ Mantiene la misma funcionalidad

#### `components/Administradores.tsx`
- ✅ Actualizado imports para usar nueva API
- ⚠️ Función de creación de administradores deshabilitada (no disponible en Flask)
- ⚠️ Gestión de relaciones cajero-administrador simplificada
- ✅ Edición de administradores existentes funcional

#### `components/Cajeros.tsx`
- ✅ Actualizado imports para usar nueva API
- ✅ Reemplazadas suscripciones en tiempo real con polling (30 segundos)
- ⚠️ Función de creación de cajeros deshabilitada (no disponible en Flask)
- ✅ Edición de cajeros existentes funcional

#### `App.tsx`
- ✅ Removido import de Supabase
- ✅ Mantiene la misma funcionalidad

### 3. Configuración y Dependencias

#### `.env`
- ✅ Creado archivo de configuración con `VITE_API_BASE_URL=http://localhost:5000`

#### `package.json`
- ✅ Removida dependencia `@supabase/supabase-js`
- ✅ Mantenidas todas las demás dependencias

## Funcionalidades Afectadas

### ✅ Funcionalidades Completamente Migradas:
1. **Autenticación de administradores**
2. **Gestión de macros CBU** (lectura y actualización)
3. **Visualización de cajeros por administrador**
4. **Edición de cajeros existentes**
5. **Visualización de administradores**
6. **Edición de administradores existentes**

### ⚠️ Funcionalidades Limitadas:
1. **Creación de nuevos cajeros** - Deshabilitada (requiere endpoint en Flask)
2. **Creación de nuevos administradores** - Deshabilitada (requiere endpoint en Flask)
3. **Gestión de relaciones cajero-administrador** - Simplificada
4. **Actualizaciones en tiempo real** - Reemplazadas con polling cada 30 segundos

### ❌ Funcionalidades Perdidas:
1. **Suscripciones en tiempo real** - No disponibles con REST API
2. **Asignación dinámica de cajeros a administradores** - Requiere endpoints adicionales

## Configuración Requerida

### Variables de Entorno:
```env
VITE_API_BASE_URL=http://localhost:5000
```

### API Flask Requerida:
La API Flask debe estar ejecutándose en `http://localhost:5000` con los siguientes endpoints:

- `POST /iniciar_sesion_administrador`
- `GET /obtener_cbus_macro`
- `PUT /modificar_cbus_macro`
- `POST /obtener_cajeros_por_administrador`
- `PUT /modificar_cajero_por_id`
- `GET /obtener_todos_administradores`
- `PUT /modificar_administrador_por_id`
- `POST /obtener_id_administrador_por_nombre`
- `POST /obtener_id_cajero_por_nombre`

## Próximos Pasos Recomendados

### Para Funcionalidad Completa:
1. **Implementar endpoints faltantes en Flask:**
   - Creación de cajeros
   - Creación de administradores
   - Gestión de relaciones cajero-administrador
   - Obtener todos los cajeros

2. **Mejorar actualizaciones en tiempo real:**
   - Implementar WebSockets en Flask
   - Reducir intervalo de polling
   - Implementar Server-Sent Events (SSE)

3. **Optimizaciones:**
   - Implementar caché en el frontend
   - Añadir indicadores de carga más granulares
   - Implementar retry logic para peticiones fallidas

## Comandos para Probar

```bash
# Instalar dependencias actualizadas
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## Notas Importantes

1. **Compatibilidad**: La aplicación mantiene la misma interfaz de usuario y flujo de trabajo
2. **Performance**: El polling puede generar más tráfico de red que las suscripciones en tiempo real
3. **Escalabilidad**: Para aplicaciones con muchos usuarios, considerar WebSockets o SSE
4. **Seguridad**: Asegurar que la API Flask implemente autenticación y autorización adecuadas

## Estado de la Migración

- ✅ **Migración Básica**: Completada
- ⚠️ **Funcionalidades Avanzadas**: Parcialmente implementadas
- 🔄 **Testing**: Pendiente
- 📝 **Documentación**: Completada