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

## 4. Configuración en EMQX

En tu archivo `docker-compose.yml` de EMQX o en su configuración interna (`emqx.conf`), deberás montar los archivos y referenciarlos para activar TLS:

```yaml
# Fragmento ilustrativo para docker-compose.yml
volumes:
  - ./certs/server.crt:/opt/emqx/etc/certs/server.crt:ro
  - ./certs/server.key:/opt/emqx/etc/certs/server.key:ro
  - ./certs/ca.pem:/opt/emqx/etc/certs/ca.pem:ro
```
