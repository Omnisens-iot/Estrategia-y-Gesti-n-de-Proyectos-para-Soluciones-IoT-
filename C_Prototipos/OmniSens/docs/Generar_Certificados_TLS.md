# Generación de Certificados TLS (Ed25519) para OmniSens

Para cumplir con la filosofía "Security by Design", la comunicación entre los dispositivos Edge (ESP32) y el Broker MQTT (EMQX) debe realizarse a través de MQTTS (puerto 8883) utilizando certificados TLS.

Para dispositivos con recursos limitados como el ESP32, el uso de criptografía de curva elíptica, específicamente el algoritmo **Ed25519**, ofrece un rendimiento significativamente superior (validación de firmas más rápida y uso reducido de memoria RAM/CPU) comparado con el tradicional RSA-2048.

A continuación se detallan los comandos de `openssl` necesarios para generar la Autoridad Certificante (CA) raíz y los certificados del servidor.

## 1. Crear la Autoridad Certificante Raíz (Root CA)

Esta es la entidad en la que confiarán nuestros dispositivos ESP32. El archivo resultante `ca.pem` es el que se deberá embeber en el firmware C++ de los microcontroladores.

```bash
# 1.1 Generar la clave privada para la CA Root usando el algoritmo Ed25519
openssl genpkey -algorithm ed25519 -out ca.key

# 1.2 Crear el certificado autofirmado para la CA (válido por 10 años)
openssl req -x509 -new -key ca.key -days 3650 -out ca.pem \
  -subj "/C=AR/ST=Cordoba/L=Cordoba/O=ISPC/OU=IoT/CN=OmniSens Root CA"
```

## 2. Crear los Certificados para el Servidor (Broker EMQX)

Estos certificados serán utilizados por el contenedor de EMQX para identificarse frente a los dispositivos Edge.

```bash
# 2.1 Generar la clave privada para el Servidor EMQX usando Ed25519
openssl genpkey -algorithm ed25519 -out server.key

# 2.2 Crear la solicitud de firma de certificado (CSR) para el Servidor
# Reemplazar "ispciot.org" por el dominio o IP real donde estará el broker si fuera distinto.
openssl req -new -key server.key -out server.csr \
  -subj "/C=AR/ST=Cordoba/L=Cordoba/O=ISPC/OU=IoT/CN=ispciot.org"

# 2.3 Firmar el certificado del servidor utilizando nuestra CA Root (válido por 1 año)
openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 -sha256
```

## 3. Resumen de Archivos Generados

Después de ejecutar los comandos, tendrás los siguientes archivos críticos:

- `ca.key`: Clave privada de la CA. **¡Debe guardarse offline en un lugar extremadamente seguro!** No se sube al servidor ni a los ESP32.
- `ca.pem`: Certificado público de la CA. **Este archivo va incrustado en el firmware del ESP32** para que confíe en el servidor.
- `server.key`: Clave privada del broker MQTT. Va en el servidor (Netbook).
- `server.crt`: Certificado público del broker MQTT. Va en el servidor (Netbook).
- `ca.srl` y `server.csr`: Archivos temporales o de seguimiento generados en el proceso.

## 4. Configuración en EMQX (Arquitectura de Doble Oyente)

Para satisfacer los requisitos de seguridad industrial en el Edge y mantener la compatibilidad con los navegadores web en el Dashboard, implementamos una arquitectura "Dual-Listener":

- **MQTTS (Puerto 8883) - Exclusivo para Hardware IoT:** Utiliza los certificados Ed25519 (Root CA propio) para máxima velocidad y seguridad en los ESP32.
- **WSS (Puerto 8084) - Exclusivo para Usuarios (Web):** Utiliza los certificados públicos de Let's Encrypt para que los navegadores confíen nativamente en la conexión WebSocket.

En tu archivo `docker-compose.yml` de EMQX, deberás montar ambas rutas y configurar los listeners mediante variables de entorno:

```yaml
volumes:
  # Certificados Ed25519 (CA Propia)
  - /home/ubuntu/emqx_certs/ed25519:/opt/emqx/etc/certs/ed25519:ro
  # Certificados Let's Encrypt (CA Pública)
  - /home/ubuntu/emqx_certs:/opt/emqx/etc/certs/letsencrypt:ro

environment:
  # Listener 1: MQTTS (Hardware) - Ed25519
  EMQX_LISTENERS__SSL__DEFAULT__BIND: 8883
  EMQX_LISTENERS__SSL__DEFAULT__KEYFILE: /opt/emqx/etc/certs/ed25519/server.key
  EMQX_LISTENERS__SSL__DEFAULT__CERTFILE: /opt/emqx/etc/certs/ed25519/server.crt
  
  # Listener 2: WSS (Web) - Let's Encrypt
  EMQX_LISTENERS__WSS__DEFAULT__BIND: 8084
  EMQX_LISTENERS__WSS__DEFAULT__KEYFILE: /opt/emqx/etc/certs/letsencrypt/key.pem
  EMQX_LISTENERS__WSS__DEFAULT__CERTFILE: /opt/emqx/etc/certs/letsencrypt/cert.pem
```
