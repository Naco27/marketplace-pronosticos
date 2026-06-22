# Guía de Despliegue en Producción - BetMarket

Esta guía detalla todos los pasos y configuraciones necesarios para desplegar la plataforma **BetMarket** (Frontend y Backend) en un entorno de producción seguro, de alto rendimiento y escalable, utilizando servicios en la nube de nivel gratuito.

---

## 1. Configuración de la Base de Datos (PostgreSQL)

Prisma está configurado para utilizar PostgreSQL de forma predeterminada. En desarrollo y producción nos conectaremos a un servidor de base de datos en la nube sin requerir la instalación de PostgreSQL localmente ni de contenedores Docker.

### Opción Recomendada: Neon.tech (o Supabase)

1. **Crear cuenta en Neon:**
   * Entra a [Neon.tech](https://neon.tech/) y crea una cuenta gratuita.
   * Crea un nuevo proyecto llamado `betmarket`.
   * Elige la región más cercana a tus usuarios (ej. `us-east-1` o `us-west-2`).
2. **Obtener la URL de conexión:**
   * Al crear el proyecto, Neon te dará una cadena de conexión.
   * Selecciona la pestaña **Prisma** o **Connection string** y copia la URL. Debe tener este formato:
     ```text
     postgresql://db_user:password@ep-some-hash.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
3. **Guardar la URL localmente:**
   * Abre `backend/.env` y actualiza la línea con tu nueva base de datos en la nube:
     ```text
     DATABASE_URL="postgresql://db_user:password@ep-some-hash.us-east-1.aws.neon.tech/neondb?sslmode=require"
     ```
4. **Ejecutar migraciones iniciales de desarrollo:**
   * En la carpeta `backend`, ejecuta para inicializar la estructura y popular la base de datos con los datos semilla:
     ```bash
     npx prisma migrate dev --name init
     npx prisma db seed
     ```

---

## 2. Despliegue del Backend (Node.js/Express)

El backend se puede hospedar de forma gratuita en plataformas como **Render** o **Railway**. Aquí explicamos los pasos usando **Render**:

1. **Subir tu código a GitHub:**
   * Guarda tus cambios y súbelos a tu repositorio de GitHub (público o privado).
2. **Crear un nuevo servicio web en Render:**
   * Inicia sesión en [Render](https://render.com/).
   * Presiona **New +** y selecciona **Web Service**.
   * Conecta tu repositorio de GitHub y selecciona la carpeta `backend` como el directorio raíz (**Root Directory**: `backend`).
 3. **Configurar parámetros del Web Service:**
   * **Runtime:** `Node`
   * **Build Command:** `npm install --production=false && npm run build`
   * **Start Command:** `npm run start`
4. **Configurar Variables de Entorno (Environment Variables):**
   Agrega las siguientes variables en la sección de configuración (**Environment**) de Render:
   * `NODE_ENV`: `production`
   * `PORT`: `5000`
   * `DATABASE_URL`: La URL de conexión de producción de tu Postgres (de Supabase o Neon).
   * `JWT_SECRET`: Una cadena aleatoria larga y segura para firmar tokens de inicio de sesión.
   * `JWT_REFRESH_SECRET`: Otra cadena aleatoria larga y segura para tokens de refresco.
   * `FRONTEND_URL`: La URL oficial de tu frontend en producción (ej. `https://betmarket.vercel.app`).
   * `CLOUDINARY_CLOUD_NAME`: Nombre de tu cuenta de Cloudinary (ver sección 4).
   * `CLOUDINARY_API_KEY`: API Key de Cloudinary.
   * `CLOUDINARY_API_SECRET`: API Secret de Cloudinary.
5. **Ejecutar Migraciones de Producción:**
   * Para aplicar automáticamente las migraciones en la base de datos de producción durante el despliegue sin interacción en la terminal, configura el **Build Command** en Render como:
     ```bash
     npm install --production=false && npm run build && npx prisma db push
     ```

---

## 3. Despliegue del Frontend (Next.js 16)

**Vercel** es la plataforma recomendada y nativa para desplegar aplicaciones Next.js.

1. **Crear proyecto en Vercel:**
   * Entra a [Vercel](https://vercel.com/) y crea un proyecto.
   * Conecta tu repositorio de GitHub y selecciona el subdirectorio `frontend` como la raíz del proyecto.
2. **Configuración de compilación:**
   * Vercel detectará automáticamente que es un proyecto Next.js y aplicará los comandos por defecto (`next build`).
3. **Variables de entorno de compilación:**
   En la configuración del proyecto en Vercel, agrega las siguientes variables de entorno:
   * `NEXT_PUBLIC_API_URL`: La URL pública de tu backend desplegado en Render (ej. `https://betmarket-backend.onrender.com/api`).
   * `NEXT_PUBLIC_API_BASE_URL`: La URL base del backend sin la ruta de la API (ej. `https://betmarket-backend.onrender.com`).
4. **Desplegar:**
   * Presiona **Deploy**. Vercel compilará la aplicación y generará tu URL pública (ej. `https://betmarket.vercel.app`).

---

## 4. Configuración de Métodos de Pago (Yape, Plin y Binance)

Dado que se ha eliminado Stripe y PayPal, todos los pagos se realizan mediante transferencias directas y verificación manual:
1. **Yape y Plin:**
   * El cliente escanea el QR o envía el dinero al número `912966742` (a nombre de Brajhan Jhoel Sandoval Duran).
   * Adjunta la captura de pantalla en el formulario de compra.
2. **Binance Pay:**
   * El cliente realiza la transferencia a la Binance Pay ID `258963147`.
   * Sube la captura de pantalla de la transacción y, opcionalmente, ingresa el código Hash/Referencia de Binance.
3. **Flujo de Aprobación:**
   * Al recibir la captura de pago (que se sube a Cloudinary), la compra queda en estado `PENDING`.
   * El Administrador o el Tipster propietario del pick ven la solicitud en su panel y, tras validar el abono en sus cuentas reales, aprueban el pago liberando el pick al instante.

---

## 5. Configuración de Almacenamiento en la Nube (Cloudinary)

Dado que los servidores de Render y Railway son efímeros (borran los archivos locales en cada reinicio), las imágenes subidas por tipsters (picks) y apostadores (capturas de Yape/Plin/Binance) deben guardarse de forma segura y permanente en la nube.

1. **Crear cuenta en Cloudinary:**
   * Regístrate gratis en [Cloudinary](https://cloudinary.com/).
2. **Obtener credenciales:**
   * En el Dashboard de Cloudinary, copia los siguientes tres valores:
     * **Cloud Name**
     * **API Key**
     * **API Secret**
3. **Configurar el Backend:**
   * Agrega estos tres valores en las variables de entorno correspondientes de tu backend en Render. El backend cambiará automáticamente de almacenamiento en disco a almacenamiento permanente en Cloudinary.

---

## 6. Verificaciones Post-Despliegue

Una vez completados los despliegues de Frontend y Backend, realiza estas pruebas rápidas:

1. **Health Check:** Entra a `https://betmarket-backend.onrender.com/api/health` y asegúrate de recibir `{ status: "ok" }`.
2. **Registro de Usuario:** Registra un nuevo tipster y un apostador en la URL del frontend y verifica que se guarden en la base de datos Postgres de Neon.
3. **Publicar Pick con Imagen:** Sube un pick con una imagen adjunta y verifica que la imagen se suba exitosamente a Cloudinary.
4. **Flujo de Pago y Desbloqueo:** Compra un pick usando Binance o Yape. Adjunta un comprobante. Inicia sesión en la cuenta del Administrador (`admin@marketplace.com`) o del Tipster y aprueba el pago pendiente. Verifica que el pick pase a estar desbloqueado y visible para el apostador.
