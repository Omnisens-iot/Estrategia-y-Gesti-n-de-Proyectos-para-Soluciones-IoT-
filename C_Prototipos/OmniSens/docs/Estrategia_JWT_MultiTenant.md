# Estrategia de Autenticación JWT para Arquitectura Multi-Tenant

Al evolucionar hacia una plataforma multi-inquilino (multi-tenant), es crítico asegurar que las operaciones del sistema (consultas a la API, aprovisionamiento) estén estrictamente limitadas al entorno de la organización correspondiente. 

La estrategia para el **Hito 2 (Backend)** utilizará **JSON Web Tokens (JWT)** como mecanismo central para la gestión del estado de sesión y el control de acceso, minimizando las consultas a la base de datos por cada petición y garantizando el aislamiento de datos.

## 1. Estructura del Payload JWT

Cuando un usuario inicia sesión correctamente (mediante email y contraseña verificada con algoritmos robustos como bcrypt o argon2), el Backend debe generar un JWT que incluya los "claims" necesarios para identificar inequívocamente al cliente al que pertenece.

**Ejemplo de Payload propuesto:**

```json
{
  "sub": "1042",               // user_id: ID interno del usuario
  "email": "operador@agro.com",// Correo electrónico del usuario
  "role": "operator",          // user_role: Nivel de permisos del usuario (admin, operator, viewer)
  "client_id": 15,             // IDENTIFICADOR MULTI-TENANT CRÍTICO (Organización)
  "iat": 1699920000,           // Issued At (Fecha de emisión)
  "exp": 1699956000            // Expiration Time (Fecha de expiración, ej. 10 horas)
}
```

## 2. Flujo de Autenticación en Endpoints REST

1. **Recepción del Token**: El Frontend (SvelteKit/Vue 3) envía el JWT en la cabecera HTTP de todas las peticiones protegidas usando el esquema Bearer: `Authorization: Bearer <token>`.
2. **Validación (Middleware)**: El Backend utiliza su clave secreta (guardada de forma segura en variables de entorno, no en el código) para verificar que la firma del token sea válida y que el token no esté expirado.
3. **Extracción y Contexto**: El middleware decodifica el token, extrae el `client_id` (y otros datos como el rol) y lo inyecta en el contexto de la petición, por ejemplo en Fastify: `request.user.client_id`.

## 3. Aislamiento de Datos (Data Isolation) en las Consultas

Gracias a la vista de base de datos creada (`vw_telemetry_by_client`), los controladores del Backend ya no necesitan hacer JOINS complejos ni lidiar con la validación de pertenencia. Simplemente deben filtrar de forma obligatoria por el `client_id` extraído del token en todas las consultas de lectura.

**Ejemplo lógico en el Backend:**

```javascript
// Endpoint: GET /api/telemetry/:device_id
const clientId = request.user.client_id;
const deviceId = request.params.device_id;

const query = `
  SELECT time, pm25, pm10, co2, temp, hum 
  FROM vw_telemetry_by_client 
  WHERE device_id = $1 AND client_id = $2
  ORDER BY time DESC LIMIT 100;
`;
// Si un usuario malicioso intenta consultar un device_id que pertenece a otro cliente, 
// la condición "client_id = $2" provocará que la consulta devuelva 0 resultados 
// (aislamiento garantizado por diseño).
```

## 4. Impacto en el Aprovisionamiento Edge (Hito 3)

El aprovisionamiento de los dispositivos ESP32 por MQTT no utiliza JWT, pero se integra perfectamente a esta arquitectura:

1. El dispositivo envía su MAC a través del tópico MQTTS `aqi/provisioning/request`.
2. El Backend buscará el dispositivo en la tabla `devices` utilizando esa MAC.
3. Al recuperar el registro, el Backend no solo obtiene el `hmac_secret` generado, sino que ya sabe implícitamente a qué `client_id` está atado ese dispositivo (configurado previamente por un administrador desde el dashboard).
4. El token de sesión HMAC devuelto autoriza al dispositivo a publicar. Cualquier dato que llegue posteriormente desde ese dispositivo, al ser insertado en `air_quality_data`, quedará automáticamente enlazado a su `client_id` gracias a la clave foránea del dispositivo.

## 5. Mejores Prácticas de Seguridad en el Token

- **Firma Criptográfica Fuerte:** Utilizar el algoritmo HS256 con un secreto de al menos 64 caracteres aleatorios, o preferentemente RS256 usando un par de claves asimétricas pública/privada.
- **Ventana de Tiempo Corta (Short-Lived):** Configurar `exp` a un valor corto (ej. 1 a 4 horas) para reducir la ventana de oportunidad si el token es interceptado.
- **Transporte Seguro:** Los tokens JWT solo deben viajar a través de HTTPS/TLS. (Garantizado por el túnel Cloudflare/Nginx en nuestra arquitectura).
