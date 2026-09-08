# MailHub Multi-Sitio 🚀

Sistema SaaS centralizado para visualizar, organizar y gestionar registros de correos y formularios de contacto provenientes de múltiples sitios web, conectado a una base de datos PostgreSQL en **Neon**, con control de acceso por roles y asignación de sitios web.

---

## 🌟 Características Principales

1. **Multi-Tenancy por Sitio Web**:
   - Cada sitio web tiene su identificador, URL, color de badge y API Key propia.
   - **Administradores**: Acceso global y completo a todos los sitios web y configuraciones.
   - **Operadores**: Acceso restringido únicamente a los sitios web que les hayan sido asignados.

2. **Bandeja de Correos Interactiva**:
   - Visualización de: Fecha, Asunto, Remitente (Nombre y Correo), Teléfono, Mensaje, Sitio Web y URL de origen.
   - **Filtros en tiempo real**: Por sitio web, por estado, por rango de fechas y buscador de texto libre.
   - **Tags de Estado**: `Nuevo`, `En Proceso`, `Contactado`, `Cerrado`, `Spam / Descartado`. Actualización instantánea en un clic.

3. **Acciones Rápidas por Correo**:
   - Botón directo de **WhatsApp** (`wa.me`) con mensaje personalizado pre-cargado.
   - Botón de **Enviar Email** (`mailto:`).
   - Botones para copiar correo y teléfono al portapapeles.
   - Sistema de **Notas Internas del Equipo** por cada correo.
   - **Historial de Auditoría** de cambios de estado.

4. **Importador de CSV Masivo**:
   - Asistente interactivo con vista previa para cargar tus correos históricos antiguos desde archivos CSV.
   - Auto-detección inteligente de columnas y mapeo por sitio web.
   - Descarga de plantilla de ejemplo en CSV.

5. **Exportación a CSV / Excel**:
   - Exporta con un solo clic los registros filtrados en pantalla.

6. **Ingesta de Formularios**:
   - Endpoint público protegido: `POST /api/submissions` con soporte de CORS y cabecera `x-api-key`.
   - Soporte para inserción directa en la base de datos de Neon si tu backend ya lo hace.
   - Generador de código listo para copiar en JavaScript, PHP (cPanel/WordPress), Python y SQL.

7. **Diseño Moderno & Temas**:
   - Modo Claro y Modo Oscuro con selector interactivo.
   - Interfaz limpia y responsiva construida con Tailwind CSS y Lucide Icons.

---

## 🛠️ Requisitos Previos

- **Node.js** v18+ o superior.
- Una cuenta en [Neon](https://neon.tech) (PostgreSQL Serverless gratuito).

---

## 🚀 Puesta en Marcha en 3 Pasos

### 1. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto (puedes basarte en `.env.example`):

```env
# URL de conexión a tu base de datos en Neon
DATABASE_URL="postgresql://usuario:contraseña@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Clave secreta para firmar sesiones JWT (mínimo 32 caracteres)
JWT_SECRET="clave-super-secreta-de-al-menos-32-caracteres-aleatorios"

# Credenciales para el Administrador inicial
ADMIN_NAME="Administrador Global"
ADMIN_EMAIL="admin@ejemplo.com"
ADMIN_PASSWORD="AdminPassword123!"
```

### 2. Crear las Tablas en Neon y Cargar Datos Iniciales
Ejecuta los siguientes comandos en tu terminal:

```bash
# 1. Crear automáticamente todas las tablas y relaciones en tu base de datos de Neon
npm run db:push

# 2. Inicializar la cuenta de Admin y datos de demostración
npm run db:seed
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador e inicia sesión con:
- **Correo**: `admin@ejemplo.com`
- **Contraseña**: `AdminPassword123!`

---

## 📁 Estructura del Código

```
correos/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Inicio de sesión seguro
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx           # Bandeja principal con filtros y tabla
│   │   │   ├── import/page.tsx    # Asistente de importación CSV
│   │   │   └── admin/
│   │   │       ├── websites/      # Gestión de portales y API Keys
│   │   │       ├── users/         # Gestión de usuarios y asignación de permisos
│   │   │       └── integration/   # Generador de código para formularios
│   │   └── api/
│   │       ├── auth/              # Endpoints de Login / Logout / Me
│   │       ├── emails/            # Consultas, estados, notas e importación masiva
│   │       ├── submissions/       # Webhook público para recibir formularios
│   │       ├── websites/          # CRUD de sitios web
│   │       └── users/             # CRUD de operadores y roles
│   ├── components/                # Componentes modulares y reutilizables
│   ├── db/
│   │   ├── schema.ts              # Esquema Drizzle ORM (Tablas, enums y relaciones)
│   │   ├── index.ts               # Conector Neon Serverless HTTP
│   │   └── seed.ts                # Inicializador de base de datos
│   └── lib/                       # Utilidades, autenticación JWT, CSV parsers
├── drizzle.config.ts
└── package.json
```

---

## 🌐 Despliegue en Producción

### Cloudflare Pages
1. Conecta tu repositorio en Cloudflare Pages.
2. Selecciona el framework preset **Next.js**.
3. En las variables de entorno de Cloudflare Pages, define:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Ejecuta el build y tu panel estará en línea globalmente con latencia ultra-baja.

### cPanel / VPS / Servidor Node.js
```bash
npm run build
npm run start
```
