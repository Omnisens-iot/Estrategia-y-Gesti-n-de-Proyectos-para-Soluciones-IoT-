# Arquitectura del Firmware OmniSens (Hito 3)

Este documento detalla la estructura, flujo y componentes principales del firmware C++ (PlatformIO) ejecutado en los dispositivos Edge (ESP32) de la plataforma OmniSens.

## 1. Topología del Proyecto y Modularidad

El firmware ha sido diseñado bajo los principios de *Separation of Concerns* (Separación de Responsabilidades) y encapsulamiento OOP. En lugar de tener un archivo `main.cpp` monolítico e ilegible, la lógica está granularizada en la carpeta `lib/`:

*   **`SensorData`**: Gestiona la ingesta de los sensores físicos (MQ135, BMP280, AHT25, LDR). Su principal responsabilidad es construir el payload JSON (`populateJson`) utilizando un bloque de memoria estática (`StaticJsonDocument`) para evitar la fragmentación del Heap.
*   **`NetworkManager`**: Capsula de comunicación aislada. Resuelve el *Zero-Touch Provisioning* MQTT, escaneo WiFi asíncrono, actualizaciones remotas OTA y el procesamiento de comandos Cloud-to-Edge mediante *Callbacks*.
*   **`LedIndicator`**: Interfaz visual de usuario (Hardware UI). Administra el estado visual de la placa sin usar un solo bloqueo (`delay()`). Todo es operado con `millis()`.
*   **`SystemLogger`**: Sistema de bitácora dinámico. Permite suprimir la salida serial a demanda (vía MQTT) para ahorrar ciclos de CPU y limpiar el monitor serial en unidades de producción.

## 2. Flujo Multihilo (FreeRTOS)

El hardware ESP32 posee dos núcleos físicos. En lugar de usar `Ticker` (que ejecuta código en ISR de alta prioridad, arriesgando pánicos del kernel si se invocan métodos de red), aprovechamos la RTOS nativa:

### `TaskSensors` (Fijada al Core 1)
1.  Es la tarea pasiva del sistema. Despierta cada 5 segundos.
2.  Alimenta al Task Watchdog Timer (`esp_task_wdt_reset()`).
3.  Solicita un semáforo (`xSemaphoreTake(sensorMutex)`).
4.  Realiza la lectura I2C/Analógica de los sensores y sobrescribe el búfer JSON.
5.  Libera el semáforo y vuelve a dormir.

### `TaskNetwork` (Fijada al Core 0)
1.  Es la tarea activa y de red. Se ejecuta continuamente con micropausas (`vTaskDelay(50)`).
2.  Alimenta al Watchdog.
3.  Verifica el pin GPIO 0 para gatillar el **Portal Cautivo** a demanda.
4.  Mantiene vivo el cliente WiFi y MQTT.
5.  Si detecta información nueva generada por `TaskSensors` (y la red está conectada), pide el semáforo, publica el JSON al broker y libera el semáforo.

## 3. Seguridad y Aprovisionamiento (Zero-Touch)

Para mitigar riesgos de robo de código o extracción de binarios, **las contraseñas MQTT no se compilan en el firmware**.
El flujo inicial es el siguiente:
1.  El ESP32 arranca. El `NetworkManager` no encuentra un token criptográfico (`hmac_token`) en su partición NVS.
2.  Se conecta al broker utilizando **su propia dirección MAC** como credencial de usuario.
3.  El servidor (EMQX ACL) lo encierra en un *Sandbox*, donde lo único que tiene permitido es publicar en `aqi/provisioning/request`.
4.  El backend procesa la solicitud, calcula un hash **HMAC-SHA256** único para esa placa basándose en una llave simétrica secreta, y se lo responde en `aqi/provisioning/response/<MAC>`.
5.  El ESP32 lo recibe, lo guarda de forma persistente en NVS y se reinicia.
6.  En su próximo inicio, utiliza su MAC y el hash recibido, lo que le abre la puerta al tópico de telemetría final (`aqi/telemetry/<MAC>/data`).

## 4. Control Cloud-to-Edge (Actuadores y Config)

La placa es bi-direccional. Soporta la recepción de comandos remotos a través del broker:
*   **`aqi/commands/<MAC>/actuators`**: Al recibir un JSON (ej. `{"r1": 1, "r2": 0, "pwm": 128}`), `NetworkManager` dispara un puntero a función (*Callback*) en `main.cpp` para conmutar los relés o la salida PWM, aislando completamente a la red del hardware subyacente.
*   **`aqi/commands/<MAC>/config`**: Recibe comandos administrativos (ej. `{"debug": false}` para silenciar el `SystemLogger`).
*   **`aqi/commands/<MAC>/ota`**: Al recibir una URL, invoca nativamente al cliente HTTP para descargar y grabar la nueva versión de firmware en la partición OTA.

## 5. Resiliencia (Task Watchdog Timer)
Ambas tareas FreeRTOS deben reportarse periódicamente (cada 15 segundos) al TWDT. Si un sensor bloquea el bus I2C o la red se congela impidiendo que la tarea complete su ciclo, el perro guardián resetea el microcontrolador de forma dura.
