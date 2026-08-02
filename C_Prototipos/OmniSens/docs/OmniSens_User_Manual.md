# 📖 Manual de Usuario: Plataforma Industrial OmniSens IoT

Bienvenido al manual integral de **OmniSens**. Esta guía está diseñada para brindar a los operadores de planta, administradores y personal de mantenimiento todas las herramientas necesarias para la instalación, configuración y explotación analítica de la red de nodos ambientales.

---

## 🏭 1. El Propósito: Eliminando la "Ceguera Operativa"

En entornos industriales, la falta de datos centralizados en tiempo real genera "ceguera operativa". **OmniSens** elimina este problema al unificar la telemetría de múltiples áreas de la planta en una plataforma **multitenant** (multiusuario). Esto significa que su empresa tendrá un entorno seguro y aislado donde sus nodos, reglas y datos le pertenecen exclusivamente, permitiéndole:
1. **Detectar anomalías** en gases, calidad del aire y confort térmico al instante.
2. **Prevenir paradas** automatizando respuestas (ej. encender extractores).
3. **Analizar tendencias** mediante gráficos históricos exportables.

---

## 🔌 2. Conexión Física y la Interfaz LED (Hardware GUI)

El nodo OmniSens (basado en el controlador ESP32) no posee una pantalla LCD para ahorrar energía y costos, pero se comunica con usted a través de un sistema de LEDs intuitivo.

### Indicadores Luminosos
Al enchufar el equipo (Fuente 5V DC o batería):
* 🔴 **LED Rojo (Power):** Se encenderá de forma fija e ininterrumpida. Indica que la placa base está recibiendo energía eléctrica.
* 🔵 **LED Azul (Conectado al GPIO 2 - GUI del Sistema):** Este LED es su medio de comunicación con el sistema operativo interno. Preste atención a su comportamiento:
  * **Parpadeo rápido inmediato al encender:** Durante los primeros **5 segundos**, el equipo le está dando una ventana de tiempo para entrar al modo de configuración (Ver Paso 3).
  * **Parpadeo lento (Buscando Wi-Fi):** El equipo está intentando conectarse a la red inalámbrica y al servidor MQTT.
  * **Encendido Fijo (Portal Cautivo activo):** El nodo generó su propia red Wi-Fi para que usted lo configure.
  * **Apagado (Operación Normal):** Una vez conectado al servidor, el LED azul se apaga para ahorrar energía y no generar contaminación lumínica.

---

## ⚙️ 3. Configuración del Nodo: Portal Cautivo y Sensores

Si el nodo es nuevo, cambió la red Wi-Fi, o desea reconfigurar qué sensores están activos, debe acceder al Portal Cautivo.

**¿Cómo acceder al Portal Cautivo?**
1. Desenchufe y vuelva a enchufar el nodo.
2. Apenas se encienda, verá el **LED Azul parpadeando rápidamente**. ¡Tiene 5 segundos!
3. **Mantenga presionado el botón "BOOT"** (GPIO 0) en la placa durante ese parpadeo.
4. El LED Azul quedará **encendido fijo**. El nodo acaba de crear una red Wi-Fi local de emergencia.

**Configurando el equipo:**
1. Desde su teléfono o PC, conéctese a la red Wi-Fi llamada **`Omnisens-Setup`**.
2. Automáticamente se abrirá una pantalla de configuración (si no ocurre, ingrese a `http://192.168.4.1` en su navegador).
3. Vaya a **"Configure WiFi"**. Aquí encontrará:
   * **Credenciales de Red:** Seleccione el Wi-Fi de la planta y ponga la contraseña.
   * **Gestión de Sensores:** Verá opciones para activar o desactivar sensores específicos (ej. MQ-135, BMP280, Polvo PM10, LDR, etc.). Apague los que no estén físicamente conectados para evitar lecturas erróneas.
   * **Dirección MAC:** Anote esta dirección (Ej: `EC:64:C9:85:0D:9C`); la necesitará luego para registrar el equipo en la nube.
4. Presione **"Save"**. El nodo se reiniciará y se enlazará a la nube.

---

## 🔐 4. Registro y Acceso a la Plataforma (Multitenant)

Como la plataforma es **Multitenant**, sus datos están asilados del resto de las empresas. 

1. Ingrese a la plataforma (Ej: `https://omnisens-iot.ddns.net`).
2. Si es usuario nuevo, haga clic en **Registrarse** y cree su cuenta corporativa.
3. Inicie sesión. Al entrar por primera vez, su entorno estará vacío porque el sistema aún no sabe cuáles nodos le pertenecen.

---

## 🖥️ 5. Vistas y Operación del Panel de Control

La plataforma ofrece múltiples vistas, cada una diseñada para un propósito específico:

### A. Gestor de Dispositivos (Device Manager)
* **Alta de Nodos:** Haga clic en "Agregar Dispositivo". Ingrese la **Dirección MAC** que anotó en el paso 3 y póngale un nombre (Ej: `Horno_Piso1`). A partir de este momento, ese nodo es exclusivamente suyo.
* **Consola RAW (Crudos):** Al hacer clic en un dispositivo registrado, podrá abrir la Consola RAW. Esta herramienta es vital para diagnóstico, ya que le muestra en tiempo real y sin procesar (formato JSON) cada paquete de datos exactamente como llega desde el sensor.

### B. Dashboard en Tiempo Real (Panel Principal)
Su centro de comandos operativo para el "aquí y ahora":
* Visualice Widgets tipo velocímetro para calidad de aire, temperatura y humedad.
* **Comando Manual de Actuadores:** Contiene botones de "Switch" para encender o apagar relés remotamente (extractores, sirenas) y controles deslizantes (Sliders) para la velocidad de motores por PWM.

### C. Analítica de Datos (Analytics)
Donde la magia de los datos ocurre para reportes y auditorías:
* **Gráficos Históricos:** Visualice cómo se comportó la calidad del aire el fin de semana. Puede hacer **Zoom in/out** arrastrando el cursor sobre un área específica del gráfico.
* **Alarmas Retroactivas:** Visualice marcadores en los gráficos donde se dispararon alertas críticas.
* **Exportación Profesional:** Con un solo clic, descargue el rango de fechas seleccionado en formato **CSV** (para Excel/PowerBI) o en un reporte **PDF** listo para enviar a gerencia.

### D. Motor de Reglas (Rules Engine)
Automatice la planta sin intervención humana. Seleccione un nodo, elija un parámetro (Ej: Temperatura), ponga un umbral (`> 35°C`) y defina la acción (`Activar Relé 1`). Las reglas se descargan al hardware, por lo que el nodo actuará incluso si pierde internet temporalmente.

---

## 🔔 6. Configuración de Alertas y Notificaciones Push

Usted no tiene que estar mirando la pantalla todo el día; el sistema le avisará:

* **Notificaciones Push Web:** En la barra superior, active la "Campanita" y permita notificaciones en su navegador. Si una regla de alarma se dispara, aparecerá un recuadro en la esquina de su pantalla alertándolo instantáneamente (incluso si tiene la plataforma en otra pestaña).
* **Alertas por Telegram (Telemetría de Salud):** OmniSens se integra con Telegram para enviar un reporte (en formato código/texto) cada 1 hora a los canales de la empresa. Este reporte resume si los equipos tienen buen nivel de señal Wi-Fi, la carga de la batería y si están operando con normalidad.

---

## ❓ 7. Guía Rápida de Diagnóstico Visual (FAQ)

Si sospecha de un problema, mire la **Interfaz LED (Azul - GPIO 2)** del equipo:

| Comportamiento LED Azul | Diagnóstico y Estado | Solución |
| :--- | :--- | :--- |
| **Parpadeo Lento / Intermitente** | Intentando conectar al Wi-Fi o Servidor MQTT. | Espere unos segundos. Si no se detiene, verifique que el Wi-Fi de la planta tenga internet. |
| **Encendido Fijo (sin parpadear)** | El nodo levantó su Portal Cautivo. | Conéctese a la red "Omnisens-Setup" con su celular para configurarlo. |
| **Apagado** (con LED Rojo encendido) | Funcionamiento Óptimo. | Todo en orden. Revise el Dashboard en la PC. |
| **No enciende ni el LED Rojo** | Falta de energía crítica. | Revise la fuente de alimentación, el cable USB o el estado de las baterías. |

---

¡Disfrute de una operación industrial inteligente, trazable y automatizada con **OmniSens**! 🏭🚀
