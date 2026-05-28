# 🗺️ Mapa de Navegación - Sistema de Autenticación

## 📍 Estructura Visual

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                       NEXUSS X SYSTEMS                       │
│              Sistema de Autenticación Profesional             │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                            ╔═══════════╗
                            ║ index.html║ ← Landing Pública
                            ║(sin auth) ║
                            ╚═════╤═════╝
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
          ┌─────────▼──────────┐  │  ┌──────────▼────────────┐
          │   "Crear cuenta"   │  │  │ "Iniciar sesión"     │
          │                    │  │  │                      │
          ▼                    │  │  ▼                      
      ┌──────────────────┐    │  │  ┌─────────────────────┐
      │ registro.html    │    │  │  │  login.html         │
      │ - Llenar datos   │    │  │  │ - Email + password  │
      │ - Validar        │    │  │  │ - Recuérdame        │
      │ - Generar código │    │  │  │ - Credenciales      │
      └────────┬─────────┘    │  │  └─────────┬───────────┘
               │              │  │            │
        (POST registro)   "¿Olvidaste?"      (POST login)
               │              │  │            │
               ▼              │  │            ▼
        ┌─────────────────────────────────────────────┐
        │         verify-email.html                    │
        │ (Verificación de email)                     │
        │ - Código de 6 dígitos                       │
        │ - Reenviar código (60s countdown)           │
        │ - Validar y completar registro              │
        └──────────────┬────────────────────────────┬─┘
                       │ (Verificado)               │
                       │                    (Cancelar)
                       ▼                            │
                 ┌──────────────┐                  │
                 │ Crear sesión │                  │
                 │ (nxs_auth)   │                  │
                 └──────┬───────┘                  │
                        │                         │
                        ▼                         ▼
        ┌─────────────────────────────────────────────┐
        │         forgot-password.html                │
        │ (Recuperación de contraseña)               │
        │ - Ingreso de email                         │
        │ - Generación de token (24h)                │
        │ - Almacenar en sessionStorage              │
        └──────────────┬────────────────────────────┘
                       │ (Email verificado)
                       │ (Token generado)
                       ▼
        ┌─────────────────────────────────────────────┐
        │         reset-password.html                 │
        │ (Reset de contraseña)                      │
        │ - Validar token y email                    │
        │ - Indicador de fortaleza                   │
        │ - Nueva contraseña                        │
        │ - Confirmación                            │
        └──────────────┬────────────────────────────┘
                       │ (Contraseña actualizada)
                       │ (Token eliminado)
                       ▼
                 ┌──────────────┐
                 │ login.html   │ ← Volver a login con nueva contraseña
                 └──────┬───────┘
                        │ (POST login)
                        │ (Credenciales válidas)
                        ▼
        ┌─────────────────────────────────────────────┐
        │ home.html (Panel Principal)                │
        │ (Protegido con data-requires-auth="true")  │
        │ - Acceso a servicios                       │
        │ - Dashboard personalizado                  │
        │ - Botón Salir (Logout)                     │
        └──────────────┬────────────────────────────┘
                       │ (Logout)
                       │ (Limpiar nxs_auth)
                       ▼
                 ┌──────────────┐
                 │ login.html   │ ← Sesión terminada
                 └──────────────┘
```

---

## 🔑 Almacenamiento por Página

### 1️⃣ **index.html**
```
NO REQUIERE AUTENTICACIÓN
├── localStorage: nxs_remember (si el usuario lo marcó)
└── Redirige a home.html si ya está autenticado
```

### 2️⃣ **login.html**
```
NO REQUIERE AUTENTICACIÓN
├── Lee: nxs_remember (para pre-llenar)
├── Lee: nxs_users (para validar credenciales)
└── Escribe: nxs_auth (si login exitoso)
```

### 3️⃣ **registro.html**
```
NO REQUIERE AUTENTICACIÓN
├── Lee: nxs_users (para evitar duplicados)
├── Escribe: nxs_users (nuevo usuario)
├── Escribe: sessionStorage (para verificación)
└── Redirige: verify-email.html
```

### 4️⃣ **verify-email.html**
```
REQUIERE sessionStorage (nxs_verify_email + nxs_verify_code)
├── Lee: sessionStorage.nxs_verify_email
├── Lee: sessionStorage.nxs_verify_code
├── Valida código de 6 dígitos
├── Escribe: nxs_auth (sesión) SI CORRECTO
└── Limpia: sessionStorage
```

### 5️⃣ **forgot-password.html**
```
NO REQUIERE AUTENTICACIÓN
├── Lee: nxs_users (para validar email)
├── Escribe: nxs_resets (token)
├── Escribe: sessionStorage (token temporal)
└── Redirige: reset-password.html
```

### 6️⃣ **reset-password.html**
```
REQUIERE sessionStorage (nxs_reset_token + nxs_reset_email)
├── Lee: sessionStorage.nxs_reset_token
├── Lee: sessionStorage.nxs_reset_email
├── Lee: nxs_resets (para validar token)
├── Escribe: nxs_users (actualiza password)
├── Elimina: nxs_resets (token usado)
└── Limpia: sessionStorage
```

### 7️⃣ **home.html**
```
REQUIERE AUTENTICACIÓN (data-requires-auth="true")
├── Valida: nxs_auth al cargar
├── Lee: nxs_auth (datos del usuario)
├── Botón "Salir" elimina: nxs_auth + nxs_remember
└── Redirige a login.html si no autenticado
```

---

## 🔄 Flujos de Datos

### Flujo 1: REGISTRO NUEVO
```
index.html
    ↓ [Click "Crear cuenta"]
registro.html
    ↓ [Ingresar datos]
    ↓ [localStorage.nxs_users += nuevo usuario]
    ↓ [sessionStorage.nxs_verify_* = código]
verify-email.html
    ↓ [Ingresar código]
    ↓ [Validar vs sessionStorage]
    ↓ [Si correcto: localStorage.nxs_auth = token]
    ↓ [Limpiar sessionStorage]
home.html ✓ SESIÓN INICIADA
```

### Flujo 2: LOGIN
```
index.html
    ↓ [Click "Iniciar sesión"]
login.html
    ↓ [Ingresar email + contraseña]
    ↓ [Buscar en localStorage.nxs_users]
    ↓ [Si credenciales válidas:]
    ↓ [localStorage.nxs_auth = token]
home.html ✓ SESIÓN INICIADA
```

### Flujo 3: RECUPERACIÓN
```
login.html
    ↓ [Click "¿Olvidaste tu contraseña?"]
forgot-password.html
    ↓ [Ingresar email]
    ↓ [Buscar en localStorage.nxs_users]
    ↓ [Generar token]
    ↓ [localStorage.nxs_resets += {token, email, expiry}]
    ↓ [sessionStorage.nxs_reset_* = token temporal]
reset-password.html
    ↓ [Ingresar nueva contraseña]
    ↓ [Validar token vs localStorage.nxs_resets]
    ↓ [Si token válido y no expirado:]
    ↓ [Actualizar localStorage.nxs_users[usuario].password]
    ↓ [Eliminar token de localStorage.nxs_resets]
    ↓ [Limpiar sessionStorage]
login.html
    ↓ [Login con nueva contraseña]
home.html ✓ SESIÓN INICIADA
```

---

## 🛡️ Validaciones por Endpoint

### `/auth/forgot-password` (POST)
```javascript
Input:  { email }
Output: { ok, token }  // En servidor

Validaciones:
✓ Email requerido
✓ Email debe ser válido
✓ Usuario debe existir
✓ Generar token único
✓ Fijar expiración 24 horas
```

### `/auth/reset-password` (POST)
```javascript
Input:  { token, email, password }
Output: { ok }  // Contraseña actualizada

Validaciones:
✓ Todos los campos requeridos
✓ Token debe ser válido
✓ Token no debe estar expirado
✓ Email debe coincidir con token
✓ Contraseña mínimo 8 caracteres
✓ Actualizar en base de datos
✓ Eliminar token usado
```

### `/auth/verify-email` (POST)
```javascript
Input:  { email, code }
Output: { ok, token, user }

Validaciones:
✓ Email requerido
✓ Código requerido
✓ Código debe ser válido
✓ Código debe coincidir
✓ Generar token JWT
✓ Marcar usuario como verificado
```

### `/auth/resend-code` (POST)
```javascript
Input:  { email }
Output: { ok }

Validaciones:
✓ Email requerido
✓ Usuario debe existir
✓ Generar nuevo código
✓ Enviar vía email (mock)
```

---

## 🔐 Seguridad por Página

### index.html
```
✓ Sin datos sensibles
✓ Solo redirecciones
✓ Lógica en cliente
```

### login.html
```
✓ Validar email válido
✓ Comparar con hash (servidor)
✓ No mostrar contraseña
✓ Generar token seguro
```

### registro.html
```
✓ Validar todos los campos
✓ Email único
✓ Contraseña mínimo 8 caracteres
✓ Hash de contraseña (servidor)
✓ Código de verificación único
✓ Sanitizar inputs
```

### verify-email.html
```
✓ Código debe coincidir exactamente
✓ Temporal en sessionStorage
✓ Se limpia después de usar
✓ Timeout de 60 segundos para reenvío
```

### forgot-password.html
```
✓ Email debe existir
✓ No revelar si email no existe
✓ Token único por intento
✓ Token expira en 24 horas
✓ Uno activo por usuario
```

### reset-password.html
```
✓ Token debe ser válido
✓ Token no debe estar expirado
✓ Email debe coincidir
✓ Contraseña mínimo 8 caracteres
✓ Marcar como usado después
```

### home.html
```
✓ Requiere autenticación
✓ Valida token al cargar
✓ Verifica expiración
✓ Logout limpia todo
```

---

## 📊 Matriz de Acceso

| Página | Sin Auth | Con Auth | Requiere Token | Requiere Session |
|--------|----------|----------|----------------|-----------------|
| index.html | ✓ | ✓ | ✗ | ✗ |
| login.html | ✓ | ↓ | ✗ | ✗ |
| registro.html | ✓ | ↓ | ✗ | ✗ |
| forgot-password.html | ✓ | ✓ | ✗ | ✗ |
| reset-password.html | ✗ | ✓ | ✗ | ✓ |
| verify-email.html | ✗ | ✓ | ✗ | ✓ |
| home.html | ✗ | ✓ | ✓ | ✗ |

Leyenda:
- ✓ Permitido
- ✗ Bloqueado/Redirigido
- ↓ Redirige si ya autenticado
- ✓ Requerido en sesión

---

## 🎯 Decisiones de Diseño

### 1. ¿Por qué dos tipos de storage?

**localStorage:**
- Datos persistentes
- Usuario recordado entre sesiones
- Usuarios registrados
- Tokens de recuperación

**sessionStorage:**
- Datos temporales
- Código de verificación
- Token de recuperación (temporal)
- Se limpia al cerrar tab

### 2. ¿Por qué hay un index.html?

**Motivos:**
- Landing pública sin autenticación
- Mejor SEO
- UX clara: "Nuevo" vs "Existente"
- Separación de concerns

### 3. ¿Por qué dos páginas de verificación?

**verify-email.html:**
- Verifica email durante registro
- Completa el ciclo de signup

**reset-password.html:**
- Verifica token durante recuperación
- Permite cambiar contraseña

Son diferentes procesos.

### 4. ¿Por qué sessionStorage para temp?

**Ventajas:**
- Se borra automáticamente al cerrar
- No persiste sin autorización
- Más seguro que localStorage
- Perfecto para datos temporales

---

## 🚦 Estados Posibles

```
Usuario No Autenticado:
├── En index.html
├── En login.html
├── En registro.html
├── En forgot-password.html
└── localStorage.nxs_auth = null

Usuario Verificando Email:
├── En verify-email.html
├── sessionStorage.nxs_verify_email = email
├── sessionStorage.nxs_verify_code = código
└── localStorage.nxs_auth = null

Usuario Recuperando Contraseña:
├── En reset-password.html
├── sessionStorage.nxs_reset_token = token
├── sessionStorage.nxs_reset_email = email
└── localStorage.nxs_auth = null

Usuario Autenticado:
├── En home.html (o cualquier página con data-requires-auth)
├── localStorage.nxs_auth = {token, user, timestamp}
└── sessionStorage = vacío
```

---

## 🔗 Relaciones entre Componentes

```
nexus.js (Lógica central)
├── Funciones de validación
├── Gestión de sesiones
├── I18N (Multiidioma)
└── Event listeners

login.html
├── Llama: validateEmail(), validatePassword()
├── Usa: NXS.API_BASE, localStorage, hasSession()
└── Emite: nxs_auth

registro.html
├── Llama: validateEmail(), validatePassword(), validatePasswordStrength()
├── Usa: localStorage, sessionStorage
└── Emite: nxs_auth, nxs_users

forgot-password.html
├── Llama: validateEmail()
├── Usa: localStorage, sessionStorage
└── Emite: nxs_resets, sessionStorage

reset-password.html
├── Llama: validatePassword(), validatePasswordStrength()
├── Usa: localStorage, sessionStorage
└── Emite: nxs_auth (actualizado)

verify-email.html
├── Llama: Validación de código
├── Usa: sessionStorage
└── Emite: nxs_auth (nuevo)

home.html
├── Valida: hasSession(), isTokenExpired()
├── Usa: requireAuthGate()
└── Redirige: login.html si no autenticado
```

---

## 📈 Flujo General del Sistema

```
┌─────────────────────────────────────────┐
│         Usuario Llega al Sitio          │
└────────────────────┬────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ ¿Está autenticado?   │
          │ (localStorage.nxs_auth)
          └────────┬─────────┬──┘
                   │ NO      │ SÍ
        ┌──────────▼──┐  ┌───▼──────────┐
        │ index.html  │  │ home.html ✓  │
        │ (Landing)   │  │ (Dashboard)  │
        └────────┬────┘  └──────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼ "Nuevo"    │   ▼ "Existente"
┌────────────┐  │  ┌─────────────┐
│registro.html│  │  │ login.html  │
└──────┬─────┘  │  └──────┬──────┘
       │        │         │
       │        │    ┌────▼─────────────┐
       │        │    │ ¿Credenciales?   │
       │        │    └─────┬──────┬─────┘
       │        │          │ NO   │ SÍ
       │        │    ┌─────▼──┐  │
       │        │    │ Error  │  │
       │        │    └────────┘  │
       │        │                │
    ┌──▼────────▼─────────────────▼─┐
    │   verify-email.html ✓          │
    │ (Código de verificación)       │
    └───────────────┬────────────────┘
                    │
           ┌────────▼────────┐
           │ ¿Código OK?     │
           └────┬─────────┬──┘
                │ NO      │ SÍ
        ┌───────▼──┐   ┌──▼───────────┐
        │ Reenviar │   │ home.html ✓  │
        │   (60s)  │   │ (Dashboard)  │
        └──────────┘   └──────────────┘
```

---

## 📱 Responsive Breakpoints

```
Mobile (< 768px)
├── Stack vertical
├── Touch-friendly buttons
├── Font sizes aumentados
└── Full width forms

Tablet (768px - 1024px)
├── 2 columnas parciales
├── Espaciado moderado
└── Formularios anchos

Desktop (> 1024px)
├── 2 columnas lado a lado
├── Máximo 1000px ancho
├── Animaciones completas
└── Hover effects
```

---

## 🎓 Aprendizajes Clave

```
1. SEGURIDAD
   ✓ Nunca confiar solo en cliente
   ✓ Validar en ambos lados
   ✓ Hash de contraseñas siempre
   ✓ Tokens con expiración

2. UX
   ✓ Indicadores visuales de fortaleza
   ✓ Confirmación clara de acciones
   ✓ Errores descriptivos
   ✓ Flujos sin confusión

3. ALMACENAMIENTO
   ✓ localStorage para persistencia
   ✓ sessionStorage para temporal
   ✓ Limpiar datos sensibles
   ✓ Validar antes de usar

4. DISEÑO
   ✓ Consistencia visual
   ✓ Animaciones sutiles
   ✓ Responsive first
   ✓ Accesibilidad importante
```

---

**Este mapa actualizado:** 13/05/2026  
**Para dudas:** Consulta AUTHENTICATION_GUIDE.md
