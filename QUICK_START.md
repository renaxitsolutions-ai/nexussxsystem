# 🚀 Guía Rápida - Sistema de Autenticación

## ⚡ Empezar en 30 segundos

### 1. Abre `index.html` en tu navegador
```
http://localhost:8080/index.html
(o arrastra el archivo al navegador)
```

### 2. Elige una opción:

#### **A) Crear Cuenta**
- Click en "Crear cuenta"
- Completa el formulario
- Se generará un código de verificación en el alert
- Ingresa el código en la siguiente página
- ¡Listo! Estás dentro

#### **B) Iniciar Sesión**
- Click en "Iniciar sesión"
- Usa estas credenciales:
  - Email: `admin@nexuss.com`
  - Contraseña: `admin123`

#### **C) Recuperar Contraseña**
- En login, click en "¿Olvidaste tu contraseña?"
- Ingresa tu email
- Se generará un token
- Crea una nueva contraseña
- Vuelve a login

---

## 📁 Estructura de Archivos

```
NexusXSystem/
├── index.html                 ← Landing (sin auth)
├── login.html                 ← Inicio de sesión
├── registro.html              ← Registro nuevo
├── verify-email.html          ← Verificar email
├── forgot-password.html       ← Recuperar contraseña
├── reset-password.html        ← Reset contraseña
├── home.html                  ← Panel (requiere auth)
├── nexus.js                   ← Lógica + validaciones
├── nexus.css                  ← Estilos
├── AUTHENTICATION_GUIDE.md    ← Docs completas
└── server/
    ├── index.js              ← Backend Express
    ├── package.json
    └── data/
        ├── users.json        ← Base de datos
        └── messages.json
```

---

## 🧪 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@nexuss.com | admin123 | Admin |
| cliente@nexuss.com | cliente123 | Cliente |

### Crear tu propia cuenta
- Email: `tu@email.com`
- Contraseña: Mínimo 8 caracteres
- El código de verificación se mostrará en un alert

---

## 🔧 Ejecutar el Servidor (Opcional)

### Requisitos
- Node.js 16+ instalado
- npm o yarn

### Instalación
```bash
cd server
npm install
npm start
```

Salida esperada:
```
Nexus X System API running on http://localhost:3002
```

### Verificar que funciona
```bash
curl http://localhost:3002/api/health
# Resultado: {"ok":true}
```

---

## 📱 Flujos Principales

### Flujo 1: Primer Registro
```
1. index.html → "Crear cuenta"
2. registro.html → Llenar formulario
3. verify-email.html → Ingresar código
4. home.html ✓ (Sesión iniciada)
```

### Flujo 2: Login Normal
```
1. index.html → "Iniciar sesión"
2. login.html → Email + contraseña
3. home.html ✓ (Sesión iniciada)
```

### Flujo 3: Recuperación
```
1. login.html → "¿Olvidaste tu contraseña?"
2. forgot-password.html → Ingresar email
3. reset-password.html → Nueva contraseña
4. login.html → Ingresar con nueva contraseña
5. home.html ✓
```

---

## 🔒 Almacenamiento Local

Todo está guardado en `localStorage`:

```javascript
// Ver datos guardados
localStorage.getItem('nxs_auth')          // Tu sesión actual
localStorage.getItem('nxs_users')          // Todos los usuarios
localStorage.getItem('nxs_resets')         // Tokens de recuperación
localStorage.getItem('nxs_remember')       // Email recordado
```

### Limpiar datos (para empezar de cero)
```javascript
// En la consola del navegador:
localStorage.clear();
sessionStorage.clear();
```

---

## ✅ Checklist de Características

- [x] Registro con email
- [x] Verificación de email
- [x] Inicio de sesión
- [x] "Recuérdame" (pre-rellena email)
- [x] Recuperación de contraseña
- [x] Reset de contraseña con token
- [x] Indicador de fortaleza
- [x] Validaciones en tiempo real
- [x] Protección de páginas
- [x] Logout
- [x] Backend Express (opcional)
- [x] Documentación completa

---

## 🎨 Personalización

### Cambiar Colores
En `nexus.css`, busca `:root` y modifica:
```css
--accent: #00d4ff;        /* Cyan */
--accent-2: #0099cc;      /* Azul */
--bg: linear-gradient(...) /* Fondo */
```

### Cambiar Mensajes
En `nexus.js`, modifica el objeto `I18N`:
```javascript
const I18N = {
  es: {
    nav_login: 'Iniciar sesión',
    // ... etc
  }
}
```

### Agregar Más Campos
1. Edita el formulario en HTML
2. Agrega validación en JavaScript
3. Actualiza el almacenamiento

---

## 🐛 Troubleshooting

### "La sesión expiró"
```javascript
// Limpiar y reiniciar
localStorage.removeItem('nxs_auth');
```

### "No puedo registrarme con el mismo email"
```javascript
// Los emails son únicos. Usa otro o limpia:
localStorage.removeItem('nxs_users');
```

### "El servidor no responde"
✓ Funciona offline con localStorage  
✓ Si quieres usar servidor: `npm start` en `/server`

### "El código de verificación no funciona"
Está en el **alert** después de registrarse, cópialo y pégalo

### "Olvidé la contraseña"
1. Click en "¿Olvidaste tu contraseña?"
2. Ingresa tu email
3. Se abre la página de reset automáticamente

---

## 📞 Funciones Útiles para Desarrollo

```javascript
// En la consola del navegador:

// Ver usuario actual
getCurrentUser()

// Ver token
getAuthToken()

// Validar email
validateEmail('test@example.com')

// Validar contraseña
validatePassword('MiContraSeña123')

// Fuerza de contraseña (1-4)
validatePasswordStrength('MiContraSeña123!')

// Limpiar sesión
localStorage.removeItem('nxs_auth');
```

---

## 🚀 Próximos Pasos

### Para Producción
1. **Conectar Base de Datos**
   - MongoDB, PostgreSQL o Firebase

2. **Envío Real de Emails**
   - SendGrid, Gmail SMTP, Mailgun

3. **HTTPS**
   - Let's Encrypt o certificado SSL

4. **Rate Limiting**
   - Proteger contra ataques de fuerza bruta

5. **2FA (Autenticación de Dos Factores)**
   - SMS o Google Authenticator

### Para Desarrollo
1. Tests automatizados
2. E2E testing con Playwright
3. Coverage de código
4. Logs mejorados

---

## 📚 Documentación Completa

Para más detalles, ver: `AUTHENTICATION_GUIDE.md`

---

## 💡 Tips

✨ **Sesión persistente** - Tu sesión se guarda incluso cerrando el navegador  
✨ **Email recordado** - Si marcas "Recuérdame", tu email se pre-llena  
✨ **Tokens seguros** - La contraseña NUNCA se envía sin hash  
✨ **Tokens expiran** - 7 días de máximo para la sesión  
✨ **Offline-first** - Funciona sin internet (localStorage)

---

**¡Listo!** 🎉 Ahora tienes un sistema de autenticación profesional.

Cualquier duda, consulta `AUTHENTICATION_GUIDE.md` o revisa el código directamente.
