# Plan de Despliegue en Producción - BetMarket

Este documento describe la estrategia y los pasos necesarios para desplegar la plataforma **BetMarket** en un entorno de producción seguro y de alto rendimiento.

## 1. Migración de Base de Datos (SQLite a PostgreSQL)

Para pasar a PostgreSQL en producción:

1.  **Cambiar el proveedor en Prisma:**
    Edita `backend/prisma/schema.prisma` y cambia el `datasource`:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
2.  **Configurar la variable de entorno:**
    En producción, establece `DATABASE_URL` apuntando a tu instancia Postgres (ej. AWS RDS, DigitalOcean Databases, o Supabase):
    ```text
    DATABASE_URL="postgresql://db_user:db_password@db_host:5432/db_name?sslmode=require"
    ```
3.  **Ejecutar migraciones en producción:**
    ```bash
    npx prisma migrate deploy
    ```

## 2. Servidor Backend (Node.js/Express)

*   **Hosting recomendado:** AWS ECS, Render, Railway o DigitalOcean App Platform.
*   **Seguridad y CORS:**
    *   Habilita `helmet` para proteger cabeceras HTTP.
    *   Configura los orígenes de CORS permitidos para que solo acepten peticiones del dominio oficial del frontend.
*   **Comando de construcción e inicio:**
    ```bash
    npm run build
    npm start
    ```

## 3. Servidor Frontend (Next.js 16)

*   **Hosting recomendado:** Vercel (óptimo para Next.js por su soporte nativo de Serverless Functions y optimización perimetral de Turbopack/Edge).
*   **Variables de entorno críticas:**
    *   `NEXT_PUBLIC_API_URL` apuntando al backend de producción.
*   **Comando de construcción:**
    ```bash
    npm run build
    ```

## 4. Integraciones de Producción

### Stripe
*   Reemplazar las credenciales de prueba (`sk_test_...`) con las de producción (`sk_live_...`).
*   Configurar el webhook de producción de Stripe para apuntar a `https://tu-api.com/api/purchases/webhook` y validar la firma usando `STRIPE_WEBHOOK_SECRET`.

### Cloudinary
*   Configurar almacenamiento persistente para almacenar las capturas de pantalla de Yape/Plin subidas por los usuarios y los avatares de Tipsters.

## 5. Monitoreo y Auditoría

*   **Logs:** Integrar servicios como Winston/Winston-Loki o Datadog para retención de logs en caliente.
*   **Rendimiento:** Monitorear latencia de base de datos con Prisma Pulse o herramientas APM.
