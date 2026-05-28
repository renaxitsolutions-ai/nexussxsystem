# Manual de Usuario — NexussXSystem v2.0

**Guía completa para administradores y usuarios del sistema**

---

## Tabla de contenidos

1. [Primeros pasos](#1-primeros-pasos)
2. [Dashboard](#2-dashboard)
3. [CRM — Gestión de contactos](#3-crm)
4. [Pipeline de ventas](#4-pipeline-de-ventas)
5. [Sistema de tickets](#5-sistema-de-tickets)
6. [Base de conocimiento](#6-base-de-conocimiento)
7. [Herramientas de IA](#7-herramientas-de-ia)
8. [Reportes y analíticas](#8-reportes-y-analíticas)
9. [Notificaciones](#9-notificaciones)
10. [Configuración de cuenta](#10-configuración-de-cuenta)
11. [Panel de administración](#11-panel-de-administración)
12. [Auditoría](#12-auditoría)
13. [Planes](#13-planes)
14. [Preguntas frecuentes](#14-preguntas-frecuentes)

---

## 1. Primeros pasos

### 1.1 Crear tu cuenta

1. Abre el navegador y ve a `http://localhost:3002`
2. Haz clic en **"Crear cuenta"** en la pantalla de inicio
3. Completa: nombre, email y contraseña (mínimo 6 caracteres)
4. Tu cuenta se crea inmediatamente y se inicia sesión automáticamente

> **Nota importante:** Si tu email coincide con el `ADMIN_EMAIL` configurado en el servidor, tu cuenta tendrá automáticamente el rol **Owner** con acceso completo a todo el sistema.

### 1.2 Iniciar sesión

1. Ve a `http://localhost:3002/login.html`
2. Ingresa tu email y contraseña
3. Si tienes 2FA activado, ingresa también el código de 6 dígitos de tu app

### 1.3 Cerrar sesión

Haz clic en el botón **"Salir"** en la barra de navegación superior.

### 1.4 Recuperar contraseña

1. En la pantalla de login, haz clic en "¿Olvidaste tu contraseña?"
2. Ingresa tu email registrado
3. Recibirás un token de recuperación (en desarrollo aparece en la consola del servidor)
4. Visita `reset-password.html?token=TU_TOKEN` para crear una nueva contraseña

---

## 2. Dashboard

El dashboard es el centro de mando del sistema. Para acceder: menú superior → **Dashboard**.

### 2.1 Panel de KPIs

Muestra 8 indicadores clave en tiempo real:
- **Ingresos totales** — Suma de todas las órdenes
- **Órdenes** — Total de órdenes recibidas
- **Contactos CRM** — Total de contactos registrados
- **Pipeline activo** — Valor de los deals que no están cerrados
- **Mensajes** — Formularios de contacto recibidos
- **Tickets abiertos** — Tickets sin resolver (con indicador de SLA vencido)
- **Deals ganados** — Oportunidades cerradas exitosamente
- **CSAT** — Puntuación promedio de satisfacción del cliente

### 2.2 Gráficas

Cuatro gráficas de barras muestran la evolución de los últimos 6 meses:
- Ingresos mensuales
- Nuevos contactos por mes
- Tickets creados por mes
- Leads (mensajes de contacto) por mes

### 2.3 Alertas automáticas

Si hay tickets con SLA vencido u órdenes pendientes, aparecerán alertas en rojo/amarillo en la parte superior.

### 2.4 Resumen ejecutivo con IA

Haz clic en **"🤖 Resumen IA"** para obtener un análisis del negocio generado automáticamente por Claude AI, incluyendo métricas clave, identificación de problemas y recomendaciones.

### 2.5 Accesos rápidos

La sección de accesos rápidos muestra tarjetas para navegar rápidamente a cualquier módulo del sistema.

---

## 3. CRM

**Menú:** CRM → Contactos  
**Acceso requerido:** Rol Agent o superior

### 3.1 Ver lista de contactos

La pantalla principal muestra una tabla con todos los contactos. Puedes:
- **Filtrar** por nombre/email/empresa, etapa o estado
- **Paginar** usando los botones Prev/Siguiente
- **Hacer clic** en cualquier fila para ver el panel de detalle

### 3.2 Etapas de un contacto

| Etapa | Descripción |
|-------|-------------|
| Nuevo | Contacto recién ingresado |
| Contactado | Ya se estableció comunicación |
| Calificado | Se confirmó que es un prospecto válido |
| Propuesta | Se le envió una propuesta comercial |
| Cliente | Compró / contrató |
| Perdido | No avanzó en el proceso |

### 3.3 Crear un nuevo contacto

1. Haz clic en **"+ Nuevo"**
2. Completa los campos (nombre es obligatorio)
3. Asigna una etapa y fuente
4. Haz clic en **"Guardar"**

### 3.4 Panel de detalle del contacto

Al hacer clic en un contacto, el panel derecho muestra:
- **Información de contacto** (email, teléfono, empresa)
- **Deals asociados** con link al pipeline
- **Tickets creados** por este contacto
- **Notas** del equipo
- **IA Insights** — análisis y recomendaciones de ventas

### 3.5 Agregar notas

En el panel de detalle, al final de la sección "Notas":
1. Escribe en el campo de texto
2. Haz clic en el botón **"+"**
La nota queda guardada con fecha y hora.

### 3.6 Importar contactos desde CSV

1. Prepara un archivo CSV con columnas: `name`, `email`, `phone`, `company`
2. Haz clic en **"⬆ CSV"**
3. Selecciona tu archivo y haz clic en **"Importar"**
4. El sistema te mostrará cuántos contactos se importaron y cuántos se omitieron (duplicados)

### 3.7 Exportar contactos

Haz clic en **"⬇ Exportar"** para descargar todos los contactos en formato CSV.

---

## 4. Pipeline de ventas

**Menú:** CRM → Pipeline  
**Acceso requerido:** Rol Agent o superior

### 4.1 Tablero Kanban

El pipeline muestra los deals organizados en columnas por etapa:
1. **Prospectando** → 2. **Calificado** → 3. **Propuesta enviada** → 4. **Negociación** → 5. **Ganado** ✅ → 6. **Perdido** ❌

La barra superior muestra: valor total del pipeline activo, cantidad de deals, deals ganados y tasa de cierre.

### 4.2 Mover un deal entre etapas

Simplemente **arrastra** la tarjeta del deal y suéltala en la columna destino. El sistema actualiza el estado automáticamente.

### 4.3 Crear un nuevo deal

1. Haz clic en **"+ Nuevo Deal"** o en **"+ Agregar deal"** dentro de una columna
2. Completa título, valor, probabilidad de cierre, fecha estimada y notas
3. Haz clic en **"Guardar"**

### 4.4 Editar un deal

Pasa el mouse sobre una tarjeta y haz clic en el ícono **✏️** que aparece.

### 4.5 Marcar un deal como Perdido

Mueve el deal a la columna "Perdido" o edítalo y selecciona la etapa "Perdido". Se pedirá una razón de pérdida opcional.

---

## 5. Sistema de tickets

**Menú:** Mi panel → Soporte  
**Acceso requerido:** Todos los usuarios

### 5.1 Crear un nuevo ticket

1. Haz clic en **"+ Nuevo ticket"**
2. Escribe un título descriptivo del problema
3. Selecciona la **prioridad** (afecta el SLA):
   - 🔴 Urgente = 4 horas
   - 🟠 Alta = 8 horas
   - 🔵 Normal = 24 horas
   - 🟢 Baja = 72 horas
4. Selecciona la **categoría**: General, Facturación, Técnico, Bug, Nueva función
5. Escribe una descripción detallada del problema
6. Haz clic en **"Enviar ticket"**

> 💡 **Consejo:** Antes de crear un ticket, revisa la [Base de Conocimiento](../knowledge.html) — puede que ya tengamos la respuesta.

### 5.2 Ver tus tickets

La lista muestra todos tus tickets con:
- Número único (TKT-0001, TKT-0002, etc.)
- Título y categoría
- Estado actual
- Prioridad
- Indicador de SLA (tiempo restante o "Vencido")

### 5.3 Seguimiento de un ticket

Haz clic en cualquier ticket para ver en el panel derecho:
- El historial completo de la conversación
- El estado del SLA con barra de progreso
- Respuestas del agente y notas internas
- IA Insights (si el agente generó un resumen)

### 5.4 Valorar la atención recibida (CSAT)

Cuando tu ticket se cierra, aparecerá la opción de valorar de 1 a 5 estrellas. Tu valoración ayuda a mejorar el servicio.

### 5.5 Para agentes: Responder un ticket

1. Selecciona el ticket en la lista
2. En el panel derecho, escribe tu respuesta en el área de texto
3. Si es una nota interna (no visible al cliente), activa la casilla "Nota interna"
4. Haz clic en **"Responder"**
5. Opcionalmente, cambia el estado del ticket desde el selector

### 5.6 Para agentes: Usar IA para responder

1. Selecciona el ticket
2. Haz clic en **"🤖 Sugerir respuesta"**
3. La IA generará una respuesta profesional y empática
4. Revisa y edita si es necesario
5. Haz clic en **"Usar esta respuesta"** para copiarla al área de texto

### 5.7 Para agentes: Resumir un ticket largo

En tickets con mucha conversación, haz clic en **"📋 Resumir"**. La IA crea un resumen del problema, estado actual y acción pendiente, que queda guardado en el ticket.

---

## 6. Base de conocimiento

**URL:** `/knowledge.html` (pública, sin login)

### 6.1 Buscar artículos

Escribe en la barra de búsqueda superior. Los resultados aparecen en tiempo real mientras escribes.

### 6.2 Navegar por categorías

Haz clic en cualquier categoría para ver sus artículos. El número en cada categoría indica la cantidad de artículos publicados.

### 6.3 Leer un artículo

Haz clic en cualquier artículo para leerlo. Al final encontrarás:
- Botones "👍 Sí" / "👎 No" para indicar si fue útil
- Enlace para abrir un ticket si el artículo no resolvió tu duda

### 6.4 Para agentes: Administrar la KB

Ve a `/kb-admin.html`:

**Crear un artículo:**
1. Haz clic en **"+ Nuevo artículo"**
2. Escribe el título y selecciona la categoría
3. Escribe el contenido en Markdown usando la barra de herramientas
4. Haz clic en **"Borrador"** para activarlo como publicado
5. Haz clic en **"💾 Guardar"**

**Herramientas Markdown disponibles:**
- H2, H3 — encabezados
- **B** — negritas
- *I* — cursiva
- Code — código inline
- Lista — lista con viñetas
- Tabla — insertar tabla
- **🤖 IA** — generar contenido automáticamente

**Vista previa:** Haz clic en **"👁 Vista previa"** para ver cómo se verá el artículo publicado.

---

## 7. Herramientas de IA

**URL:** `/ai-tools.html`  
**Requiere:** API Key de Anthropic configurada en el servidor

### 7.1 Generar contenido

1. Selecciona el **tipo de contenido**:
   - 📝 Blog Post — Artículo completo con estructura
   - 📧 Email — Email de marketing con asunto y firma
   - 📱 Social Media — 3 variaciones para LinkedIn, Instagram y X
   - 🎯 Landing Page — Copy completo para página de ventas
   - 🏷️ Producto — Descripción de producto/servicio
   - ❓ FAQ — Preguntas y respuestas frecuentes
   - 📣 Publicidad — Copy para Google Ads / Facebook Ads
   - ✨ Personalizado — Cualquier tipo de contenido

2. Escribe tu **tema** en el área de texto
3. Selecciona el **tono** deseado
4. Selecciona la **extensión** del contenido
5. Agrega **instrucciones adicionales** si necesitas algo específico
6. Haz clic en **"🚀 Generar contenido"**

### 7.2 Usar el contenido generado

- **📋 Copiar** — Copia el texto al portapapeles
- **💾 Guardar en Blog** — Guarda como borrador en el blog del sistema
- **🔄 Regenerar** — Genera una versión diferente del mismo tema

---

## 8. Reportes y analíticas

**URL:** `/reports.html`  
**Acceso requerido:** Rol Agent o superior

### 8.1 Métricas disponibles

El panel de reportes incluye:
- 10 KPIs del negocio
- Ingresos por mes (últimos 6 meses)
- Tickets por categoría y prioridad
- Embudo de ventas (funnel) con valor por etapa
- Puntuación CSAT con estrellas
- Nuevos contactos por mes
- Tickets creados por mes

### 8.2 Resumen ejecutivo con IA

Haz clic en **"🤖 Generar resumen con IA"** para obtener un análisis automático con insights clave y acciones prioritarias recomendadas.

### 8.3 Exportar datos

Haz clic en **"⬇ Exportar CSV"** para descargar un resumen de las métricas principales en formato CSV (compatible con Excel y Google Sheets).

---

## 9. Notificaciones

**URL:** `/notifications.html`

Las notificaciones se generan automáticamente cuando:
- Se crea un nuevo ticket (para agentes)
- Un agente responde tu ticket (para ti)
- Se te asigna un proyecto
- Se registra un nuevo usuario (para admins)
- Se recibe una nueva orden (para admins)

### 9.1 Filtrar notificaciones

Usa los chips de filtro: Todas / Sin leer / Éxito / Alertas / Urgentes / Info

### 9.2 Marcar como leída

Haz clic en cualquier notificación para marcarla como leída. Si tiene un enlace, te llevará a la sección correspondiente.

Haz clic en **"✓ Marcar todas como leídas"** para limpiar todas las notificaciones pendientes.

---

## 10. Configuración de cuenta

**URL:** `/settings.html`

### 10.1 Editar perfil

En la pestaña **"👤 Perfil"**:
- Cambia tu nombre y número de teléfono
- Agrega una URL de foto de perfil
- Tu email no se puede cambiar (es tu identificador único)

### 10.2 Cambiar contraseña

En la pestaña **"🔒 Seguridad"**:
1. Ingresa tu contraseña actual
2. Escribe la nueva contraseña (mínimo 6 caracteres)
3. Confirma la nueva contraseña
4. Haz clic en "Cambiar contraseña"

### 10.3 Activar 2FA (Two-Factor Authentication)

En la pestaña **"📱 2FA"**:
1. Haz clic en **"Configurar 2FA"**
2. Escanea el código QR con tu app (Google Authenticator, Authy, etc.)
3. Ingresa el código de 6 dígitos que aparece en la app
4. Haz clic en **"Activar 2FA"**

Desde ese momento, cada vez que inicies sesión necesitarás ingresar un código de tu app.

### 10.4 Gestionar API Keys

En la pestaña **"🔑 API Keys"**:

**Crear una clave:**
1. Escribe un nombre descriptivo (Ej: "Integración Zapier")
2. Haz clic en **"Crear clave"**
3. **⚠️ IMPORTANTE:** La clave completa solo se muestra una vez. Cópiala inmediatamente.

**Usar la clave:**
Agrega el header `X-API-Key: nxs_tu_clave_aqui` en tus peticiones HTTP.

**Eliminar una clave:**
Haz clic en "Eliminar" junto a la clave. Esta acción es irreversible.

---

## 11. Panel de administración

**URL:** `/admin.html`  
**Acceso requerido:** Rol Agent o superior

El panel tiene 5 pestañas:

### 11.1 Mensajes

Muestra todos los mensajes enviados desde el formulario de contacto. Puedes:
- Buscar y filtrar por estado
- Ver el contenido completo haciendo clic en una fila
- Marcar como respondido
- Eliminar mensajes
- Exportar a CSV

### 11.2 Órdenes

Lista de todas las órdenes de compra. Puedes cambiar el estado de cada orden:
- Pendiente → Confirmado → Completado / Cancelado

### 11.3 Usuarios *(solo Admin/Owner)*

Gestión completa de usuarios del sistema:
- Ver todos los usuarios con su rol, estado de verificación y 2FA
- Editar el rol de cualquier usuario
- Eliminar usuarios

### 11.4 Automatizaciones *(solo Manager o superior)*

Gestión de reglas de automatización:
- Ver todas las reglas con su trigger y estado
- Activar/desactivar reglas con el toggle
- Crear nuevas reglas
- Eliminar reglas existentes

### 11.5 Branding *(solo Admin/Owner)*

Personalización del sistema:
- Cambiar el nombre de la empresa
- Actualizar la URL del logo
- Cambiar el color primario
- Configurar servidor SMTP para envío de emails

---

## 12. Auditoría

**URL:** `/audit.html`  
**Acceso requerido:** Admin/Owner

Muestra el historial completo de todas las acciones realizadas en el sistema.

### 12.1 Filtros disponibles

- **Usuario** — Filtrar por email del usuario que realizó la acción
- **Acción** — Buscar tipo de acción (Ej: "ticket.created", "user.login")
- **Entidad** — Filtrar por tipo de objeto afectado
- **Fecha desde/hasta** — Rango de fechas

### 12.2 Ver detalles

Haz clic en el botón **"Ver"** de cualquier registro para ver los detalles completos en formato JSON, incluyendo los cambios realizados.

---

## 13. Planes

**URL:** `/plans.html` (pública)

Muestra los 4 planes disponibles con sus precios y características:

| Plan | Precio/mes | Para quién |
|------|-----------|-----------|
| Starter | $49 | Freelancers y proyectos pequeños |
| Business | $199 | Equipos en crecimiento |
| Agency | $499 | Agencias con múltiples clientes |
| Enterprise | Personalizado | Grandes organizaciones |

### 13.1 Cambiar de plan *(solo Admin/Owner)*

1. Ve a `/plans.html`
2. Haz clic en **"Empezar ahora"** en el plan deseado
3. El sistema actualizará el plan y te indicará cómo proceder con el pago

---

## 14. Preguntas frecuentes

**¿Por qué no recibo emails del sistema?**
Sin configuración SMTP, los emails solo aparecen en la consola del servidor. Configura el SMTP en Admin → Branding para recibir emails reales.

**¿Puedo usar el sistema sin API Key de Anthropic?**
Sí. Todas las funciones normales funcionan sin IA. Solo las funciones marcadas con 🤖 requieren la clave de Anthropic.

**¿Cómo agrego más usuarios?**
Los usuarios se registran ellos mismos en `/registro.html`. Un Admin puede cambiar sus roles desde Admin → Usuarios.

**¿El 2FA es obligatorio?**
No, es opcional. Se recomienda activarlo para cuentas con rol Admin u Owner.

**¿Cómo hago backup de los datos?**
Copia el archivo `server/data/nexus.db`. Ese archivo contiene toda la base de datos.

**¿Puedo importar datos del sistema anterior?**
Si tenías datos en los archivos JSON (versión v1), puedes consultar la documentación técnica para la migración.

---

*Manual preparado para el proyecto final de grado — 5to B*
*Desarrollo y Administración de Aplicaciones Informáticas*
