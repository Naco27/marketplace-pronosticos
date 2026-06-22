# Documentación de la API REST - BetMarket

Esta es la especificación técnica de la API de BetMarket. Todos los endpoints están bajo el prefijo `/api`.

## Autenticación

### 1. Registro de Usuario
*   **Endpoint:** `POST /auth/register`
*   **Cuerpo (JSON):**
    ```json
    {
      "email": "punter1@marketplace.com",
      "password": "password123",
      "name": "Carlos Apostador",
      "role": "PUNTER" // "ADMIN", "TIPSTER", "PUNTER"
    }
    ```
*   **Respuesta Exitosa (201 Created):**
    ```json
    {
      "message": "User registered successfully.",
      "accessToken": "eyJhb...",
      "refreshToken": "eyJhb...",
      "user": {
        "id": "uuid-v4-string",
        "email": "punter1@marketplace.com",
        "name": "Carlos Apostador",
        "role": "PUNTER",
        "isVerified": false,
        "avatarUrl": null
      }
    }
    ```

### 2. Inicio de Sesión
*   **Endpoint:** `POST /auth/login`
*   **Cuerpo (JSON):**
    ```json
    {
      "email": "tipster1@marketplace.com",
      "password": "password123"
    }
    ```
*   **Respuesta Exitosa (200 OK):** Devuelve tokens de acceso (15m) y refresco (7d).

### 3. Rotación de Token
*   **Endpoint:** `POST /auth/refresh`
*   **Cuerpo (JSON):**
    ```json
    {
      "refreshToken": "eyJhb..."
    }
    ```
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "accessToken": "new-access-token",
      "refreshToken": "new-refresh-token"
    }
    ```

### 4. Perfil de Usuario (Autenticado)
*   **Endpoint:** `GET /auth/profile`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Respuesta Exitosa (200 OK):** Retorna el perfil y estadísticas de Tipster (si aplica).

---

## Pronósticos Deportivos

### 1. Publicar Pronóstico (Tipster únicamente)
*   **Endpoint:** `POST /predictions`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Cuerpo (JSON):**
    ```json
    {
      "sport": "Fútbol",
      "league": "Champions League",
      "eventDate": "2026-06-12T20:45:00.000Z",
      "odds": 1.95,
      "stake": 5,
      "price": 15.00,
      "description": "Real Madrid vs Bayern - Ambos anotan."
    }
    ```

### 2. Explorar Pronósticos (Opcional Autenticado)
*   **Endpoint:** `GET /predictions`
*   **Parámetros query (opcionales):** `sport`, `league`, `minOdds`, `maxOdds`, `tipsterId`
*   **Lógica de Negocio:** Si el usuario no ha pagado por el pick, la descripción se devuelve enmascarada: `"🔒 CONTENIDO PREMIUM OCULTO..."`. Si ya fue comprado, se devuelve la descripción real.

### 3. Detalle de Pronóstico (Opcional Autenticado)
*   **Endpoint:** `GET /predictions/:id`

### 4. Resolver Pronóstico (Tipster Propietario o Admin)
*   **Endpoint:** `POST /predictions/:id/resolve`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Cuerpo (JSON):**
    ```json
    {
      "result": "WON" // "WON", "LOST", "VOID"
    }
    ```
*   **Acción:** Resuelve el partido y actualiza automáticamente el Yield y Profit del Tipster.

---

## Compras y Pasarela de Pagos

### 1. Iniciar Checkout
*   **Endpoint:** `POST /purchases/checkout`
*   **Headers:** `Authorization: Bearer <accessToken>` (Opcional)
*   **Cuerpo (JSON):**
    ```json
    {
      "predictionId": "prediction-uuid",
      "paymentMethod": "BINANCE" // "BINANCE", "YAPE", "PLIN"
    }
    ```
*   **Respuesta (Yape/Plin/Binance):** Retorna las instrucciones de transferencia y QR correspondiente.

### 2. Simular Transacción Exitosa (Pruebas / Mock)
*   **Endpoint:** `POST /purchases/simulate-success`
*   **Cuerpo (JSON):**
    ```json
    {
      "purchaseId": "purchase-uuid",
      "transactionId": "mock-transaction-id"
    }
    ```
*   **Acción:** Completa la orden simulando éxito directo (para entornos de pruebas locales), deduce el 10% de comisión de la plataforma e incrementa el saldo del Tipster.

### 3. Enviar Comprobante (Yape/Plin/Binance)
*   **Endpoint:** `POST /purchases/submit-proof`
*   **Cuerpo (JSON):**
    ```json
    {
      "purchaseId": "purchase-uuid",
      "referenceCode": "19842859",
      "screenshotUrl": "https://url-imagen-cloudinary.com/comprobante.png"
    }
    ```

### 4. Aprobar Pago Manual (Admin / Tipster)
*   **Endpoint:** `POST /purchases/approve-manual`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Cuerpo (JSON):**
    ```json
    {
      "purchaseId": "purchase-uuid",
      "paymentMethod": "BINANCE",
      "referenceCode": "19842859"
    }
    ```
