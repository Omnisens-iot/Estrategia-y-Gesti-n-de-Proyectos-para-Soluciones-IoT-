# Documentación de Hardware: Asignación de Pines (Pinout)
**Dispositivo:** Nodo OmniSens AQC (Air Quality & Control)
**Microcontrolador:** ESP32 (WROOM-32)

Este documento detalla la asignación de puertos GPIO (General Purpose Input/Output) configurada en el firmware base (`main.cpp`) para conectar todos los sensores y actuadores físicos del Nodo AQC.

---

## 1. Bus I2C (Sensores Digitales)
El bus I2C está configurado en los pines estándar del ESP32. Todos los siguientes sensores deben conectarse en paralelo a estos dos pines, utilizando la alimentación correspondiente (generalmente 3.3V).

| Función | ESP32 GPIO | Sensores Conectados en el Bus |
| :--- | :---: | :--- |
| **SDA (Data)** | **GPIO 21** | AHT25, BMP280, BH1750 |
| **SCL (Clock)**| **GPIO 22** | AHT25, BMP280, BH1750 |

---

## 2. Entradas Analógicas (Sensores ADC)
Los siguientes sensores analógicos deben conectarse a los pines ADC (Conversor Analógico a Digital) del ESP32. Todos los pines seleccionados (`34`, `35`, `36`, `39`) son seguros para lectura analógica y no interfieren con el arranque del módulo (WiFi/Boot).

| Sensor / Función | ESP32 GPIO | Etiqueta en Placa | Notas |
| :--- | :---: | :---: | :--- |
| **LDR** (Fotorresistencia) | **GPIO 36** | `VP` / `SENSOR_VP` | **Topología recomendada para 0dB (0 a 1V):** `3.3V` -> **Resistencia 22kΩ** -> `[Nodo GPIO 36]` -> **LDR en paralelo con Resistencia 10kΩ** -> `GND`. Esto asegura que el pin jamás supere 1.03V en oscuridad total y baje a ~0V en luz plena. |
| **MQ-135** (Calidad de Aire) | **GPIO 39** | `VN` / `SENSOR_VN` | **Conexión Directa con Protección:** Dado que el módulo tiene un RL de 1kΩ, su salida (AOUT) será de milivoltios. **NO usar divisor resistivo**. Conectar `AOUT` -> **Resistencia 10kΩ en serie** -> `GPIO 39`. (La resistencia de 10kΩ protege al ESP32 por si el sensor falla y saca 5V). |
| **Sharp PM10** (AOUT) | **GPIO 34** | `34` | Salida del sensor óptico. Divisor resistivo recomendado: **33kΩ + 5.6kΩ** (aprox. 39kΩ) y 10kΩ GND. |
| **Monitor de Batería** | **GPIO 35** | `35` | Divisor para 4.2V a <1V (0dB). Resistencias usadas: **22kΩ + 5.6kΩ** (aprox. 27kΩ) hacia BAT, 10kΩ GND. |

---

## 3. Salidas Digitales / Actuadores
Estos pines están configurados como salidas para controlar hardware de potencia (mediante relés o transistores).

| Componente | ESP32 GPIO | Etiqueta | Función |
| :--- | :---: | :---: | :--- |
| **Relé 1** | **GPIO 33** | `33` | Control digital (ON/OFF) de potencia. |
| **Relé 2** | **GPIO 25** | `25` | Control digital (ON/OFF) de potencia. |
| **Salida PWM** | **GPIO 32** | `32` | Control de velocidad variable (ej. Actuador externo, dimer). Controlable desde la plataforma. |
| **Sharp PM10** (ILED) | **GPIO 4** | `4` | Salida digital para pulsar el LED infrarrojo del sensor de polvo. |
| **Sharp PM10** (Ventilador) | **GPIO 27** | `27` | Salida PWM dedicada para el forzador de aire del tubo del sensor. Se activa automáticamente antes de cada lectura. |

---

## 4. Pines de Sistema (Integrados)
Pines reservados para la interacción básica con la placa física y la red.

| Función | ESP32 GPIO | Notas |
| :--- | :---: | :--- |
| **Botón BOOT** | **GPIO 0** | Integrado en la placa. Mantener presionado por >3 seg. para lanzar el Portal Cautivo WiFi. |
| **LED de Estado** | **GPIO 2** | Integrado en la placa. Usado para indicar conexión (Parpadeo) y modo de red. |

---

## 5. Expansión Futura (Comunicaciones LoRa)
De cara a futuras ampliaciones del hardware para implementar conectividad **LoRa/LoRaWAN**, la asignación de pines actual deja libres los puertos estándar necesarios. Se recomienda dejar previstos ambos puertos (SPI y UART) en el diseño final del PCB para permitir flexibilidad en la elección del módulo:

### Opción A: Módulo Transceptor Directo (SPI)
Módulos tipo **SX1276 / SX1278 / RFM95**. Requieren que el ESP32 controle directamente el radiofrecuencia y la modulación. Son más económicos pero requieren mayor procesamiento de firmware (librerías LoRa).
* **Pines Reservados (VSPI estándar):**
  * `GPIO 5` -> CS (Chip Select)
  * `GPIO 18` -> SCK (Clock)
  * `GPIO 19` -> MISO
  * `GPIO 23` -> MOSI
  * `GPIO 15` u otro libre -> DIO0 (Interrupción) / RST

### Opción B: Módulo Inteligente (Serial UART)
Módulos tipo **Ebyte E32 / Reyax RYLR998**. Poseen su propio microcontrolador interno que maneja la radiofrecuencia. Se comunican enviando y recibiendo comandos o datos por puerto serial. Es la **opción recomendada** para una integración más rápida y estable, ya que quita carga de procesamiento al ESP32.
* **Pines Reservados (UART2):**
  * `GPIO 16` -> RX2 (Recibe del TX del LoRa)
  * `GPIO 17` -> TX2 (Transmite al RX del LoRa)
  * Opcionalmente `GPIO 13` y `GPIO 14` para control de modos (M0/M1 o AUX en módulos Ebyte).

---

### Notas de Ensamblaje Industrial:
1. **Niveles Lógicos:** Los pines GPIO del ESP32 operan estrictamente a **3.3V**. Cualquier señal superior (como los 5V de la alimentación lógica del MQ135 o del sensor Sharp PM10) dañará el pin. Si un sensor opera en 5V y devuelve 5V en su salida de datos, debes colocar un conversor de nivel lógico o un divisor resistivo.
2. **Corriente:** Un pin GPIO del ESP32 puede entregar un máximo de 40mA (aunque se recomiendan 20mA). Nunca conectes los relés o motores directamente a los pines. Usa módulos de relés optoacoplados o transistores (MOSFET/BJT).
3. **Pines Analógicos:** Los pines 34, 35, 36 y 39 son *solo de entrada* y carecen de resistencias pull-up/pull-down internas. Asegúrate de diseñar el circuito externo (PCB) adecuadamente.
