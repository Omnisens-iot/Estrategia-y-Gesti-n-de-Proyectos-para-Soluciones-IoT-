#include "NetworkManager.h"
#include <SystemLogger.h>
#include <time.h>

// Placeholder para CA Cert
const char* rootCACertificate = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIDbzCCAlegAwIBAgIUT39mJ/NjufseQyTmiASomEgtLG8wDQYJKoZIhvcNAQEL\n" \
"BQAwRzELMAkGA1UEBhMCQVIxEDAOBgNVBAgMB0NvcmRvYmExETAPBgNVBAoMCE9t\n" \
"bmlTZW5zMRMwEQYDVQQDDApPbW5pU2Vuc0NBMB4XDTI2MDYxNjA2MDUwM1oXDTM2\n" \
"MDYxMzA2MDUwM1owRzELMAkGA1UEBhMCQVIxEDAOBgNVBAgMB0NvcmRvYmExETAP\n" \
"BgNVBAoMCE9tbmlTZW5zMRMwEQYDVQQDDApPbW5pU2Vuc0NBMIIBIjANBgkqhkiG\n" \
"9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2i8t/geVCUZ0+SFl8cpaoBR7dXx1ujJVshDu\n" \
"Mel4HFDqCIxzqGvFJEbdeerbnfMvln0O3knIb8e1YjsEdG8IlBYugCCKAAb328ve\n" \
"bKBsNOMN907/fBoEKXuHyNdsNjTWr05wEqqDj4JMlfB+3KxiA3kZVIpcGv1IReQp\n" \
"N5FVsH1R6UmBWClnU7vVzL+jFGUngiEbu7HZbpl9VqFbroDfybuphhPM05S6rGuE\n" \
"Iom7MZBCVkgUKsQjZGmarfIU5hxMZDHMVhA7jKNnkDvrcQGRhkspX3Ib0J28vQZg\n" \
"bMEhM0KPc/eJ1J38Dya7+h8mC6Es/K6tXFe2+F3YFB2FX5yFMwIDAQABo1MwUTAd\n" \
"BgNVHQ4EFgQUoeIIBK3s4G/3K1rEamD+RvH1GjEwHwYDVR0jBBgwFoAUoeIIBK3s\n" \
"4G/3K1rEamD+RvH1GjEwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC\n" \
"AQEAKDgGeaQnPeO6X8BIwEb5t+CBt5NttJdgBJzK7SKS8+/ZKFTmtLn+WdgBp94g\n" \
"mBD8i+fOYZhl73DW3kCVttHYV0EyLvokeXQmiq0fVMeQ0ktYgl+DyuWtNc62Kwsm\n" \
"xCtIrpl2epZ09rb7JncagimtTANBHLF6gIDpr7eWZmhNqZtCtIUn6NLFpdblxMiG\n" \
"AVzvcdknbWMP4DGiKua/wiAUBDj42xWI4qkgue9ErpIwwkPXg75GBexc1PgfFCJc\n" \
"y7wUyHlXmCz8EiBlfRWqKdWxN6/qfe/XYgUKzr1zu+azJnPv+LSG9mFycvKCq+PN\n" \
"9IdyVsJbVJhFQ1/eJ1IWLjyUYQ==\n" \
"-----END CERTIFICATE-----\n";

NetworkManager* globalNetworkManager = nullptr;

NetworkManager::NetworkManager(const char* broker, uint16_t port, LedIndicator* led)
    : _broker(broker), _port(port), _led(led) {
    globalNetworkManager = this;
}

void NetworkManager::begin() {
    SystemLogger::begin(); // Inicializar estado de logs
    
    // IMPORTANTE: mbedTLS en ESP32 tiene un bug/limitacion conocida al validar 
    // direcciones IP directas en el campo SAN del certificado.
    // Para producción, se recomienda usar un dominio real (ej. mqtt.omnisens.com).
    // Por ahora, como conectamos por IP, usamos setInsecure() para MQTTS.
    // _wifiClient.setCACert(rootCACertificate); 
    _wifiClient.setInsecure();

    _mqttClient.setClient(_wifiClient);
    _mqttClient.setServer(_broker, _port);
    _mqttClient.setCallback(NetworkManager::mqttCallbackWrapper);
    _mqttClient.setBufferSize(512);

    _macAddress = WiFi.macAddress();
    _macAddress.replace(":", "");
    SystemLogger::info(String("Direccion MAC local (formato MQTT): ") + _macAddress);

    _prefs.begin("omnisens", false);
    _hmacToken = _prefs.getString("hmac_token", "");

    loadConfig(); // Cargar la configuración de los sensores

    _wm.setDebugOutput(SystemLogger::isDebugEnabled());
    _wm.setConfigPortalBlocking(false); 
    _wm.setSaveConfigCallback(NetworkManager::saveConfigCallbackWrapper);

    connectWiFi();
    syncTime(); // Sincronizar reloj para poder validar los certificados TLS
}

void NetworkManager::setActuatorCallback(ActuatorCallback cb) {
    _actuatorCb = cb;
}

void NetworkManager::setRulesCallback(RulesCallback cb) {
    _rulesCb = cb;
}

void NetworkManager::loop() {
    if (_portalRunning) {
        _wm.process();
        return; 
    }

    if (WiFi.status() != WL_CONNECTED) {
        _led->setMode(LED_CONNECTING);
    }

    if (WiFi.status() == WL_CONNECTED) {
        if (!_mqttClient.connected()) {
            _led->setMode(LED_CONNECTING);
            unsigned long now = millis();
            if (now - _lastReconnectAttempt > 5000) {
                _lastReconnectAttempt = now;
                connectMQTT();
            }
        } else {
            _led->setMode(LED_CONNECTED);
            _mqttClient.loop();
        }
    }
}

void NetworkManager::checkCaptivePortalBoot(uint8_t bootPin, uint32_t waitTimeMs) {
    SystemLogger::info(String("Tienes ") + String(waitTimeMs / 1000) + " segundos para presionar BOOT y entrar al Portal Cautivo...");
    
    uint32_t startMs = millis();
    bool triggerPortal = false;
    
    while (millis() - startMs < waitTimeMs) {
        // Parpadeo rápido para indicar la ventana de tiempo
        if ((millis() / 100) % 2 == 0) {
            _led->setMode(LED_AP_MODE); // Utilizar el color del portal (ej. azul)
        } else {
            _led->setMode(LED_OFF);
        }
        _led->update();
        
        if (digitalRead(bootPin) == LOW) {
            triggerPortal = true;
            break;
        }
        delay(10); // Pequeño delay para no saturar
    }
    
    if (triggerPortal) {
        SystemLogger::info("Boton presionado. Iniciando Portal Cautivo BLOQUEANTE.");
        _led->setMode(LED_AP_MODE);
        _led->update();
        
        // El portal bloquea la ejecución hasta que el usuario guarda credenciales o sale
        _wm.setConfigPortalBlocking(true); 
        _wm.startConfigPortal("Omnisens-Setup");
        
        SystemLogger::info("Saliendo del Portal Cautivo. Reiniciando el ESP32 para aplicar cambios...");
        delay(1000);
        ESP.restart(); // Reiniciar siempre después del portal para aplicar cambios limpiamente
    } else {
        SystemLogger::info("Tiempo expirado. Iniciando modo normal.");
        _led->setMode(LED_OFF);
        _led->update();
    }
}

bool NetworkManager::isConnected() {
    return WiFi.status() == WL_CONNECTED && _mqttClient.connected();
}

void NetworkManager::connectWiFi() {
    SystemLogger::info("Conectando a WiFi...");
    _led->setMode(LED_CONNECTING);
    
    // Configurar timeouts del portal cautivo de emergencia
    _wm.setConnectTimeout(20); // 20 segundos para intentar conectar al AP guardado
    _wm.setConfigPortalTimeout(120); // 2 minutos máximo si levanta el portal de emergencia
    
    if (_wm.autoConnect("Omnisens-Setup")) {
        SystemLogger::info("WiFi Conectado!");
    } else {
        SystemLogger::error("Fallo la conexion o se agoto el tiempo del Portal de Emergencia. Reiniciando...");
        delay(2000);
        ESP.restart();
    }
}

void NetworkManager::syncTime() {
    SystemLogger::info("Sincronizando reloj por NTP (Requerido para TLS)...");
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    
    time_t now = time(nullptr);
    int retries = 0;
    while (now < 24 * 3600 && retries < 15) { // Esperar hasta que el año sea > 1970
        delay(500);
        now = time(nullptr);
        retries++;
    }
    
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
        char timeStringBuff[50];
        strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S", &timeinfo);
        SystemLogger::info(String("Reloj sincronizado: ") + timeStringBuff);
    } else {
        SystemLogger::error("Fallo la sincronizacion NTP.");
    }
}

void NetworkManager::connectMQTT() {
    SystemLogger::info("Intentando conectar a MQTT...");
    
    if (_hmacToken.length() > 0) {
        SystemLogger::debug("Usando Token Dinamico...");
        if (_mqttClient.connect(_macAddress.c_str(), _macAddress.c_str(), _hmacToken.c_str())) {
            SystemLogger::info("Conectado a MQTT exitosamente.");
            
            // Suscripciones
            String otaTopic = "aqi/commands/" + _macAddress + "/ota";
            String actuatorsTopic = "aqi/commands/" + _macAddress + "/actuators";
            String configTopic = "aqi/commands/" + _macAddress + "/config";
            
            _mqttClient.subscribe(otaTopic.c_str());
            _mqttClient.subscribe(actuatorsTopic.c_str());
            _mqttClient.subscribe(configTopic.c_str());
        } else {
            SystemLogger::error("Fallo conexion MQTT.");
        }
    } else {
        SystemLogger::info("Modo Aprovisionamiento...");
        if (_mqttClient.connect(_macAddress.c_str(), _macAddress.c_str(), "provisioning")) {
            String responseTopic = "aqi/provisioning/response/" + _macAddress;
            _mqttClient.subscribe(responseTopic.c_str());
            
            StaticJsonDocument<128> req;
            req["mac_address"] = _macAddress;
            req["timestamp"] = millis(); 
            
            char buffer[128];
            serializeJson(req, buffer);
            _mqttClient.publish("aqi/provisioning/request", buffer);
        }
    }
}

void NetworkManager::publishDeviceConfig() {
    if (!isConnected()) return;
    
    String topic = "aqi/telemetry/" + _macAddress + "/config_status";
    StaticJsonDocument<256> doc;
    doc["device_id"] = "AQC_001";
    
    JsonObject sensors = doc.createNestedObject("sensors");
    sensors["mq135"] = _en_mq135;
    sensors["bmp280"] = _en_bmp280;
    sensors["aht25"] = _en_aht25;
    sensors["ldr"] = _en_ldr;
    sensors["bh1750"] = _en_bh1750;
    sensors["sharp_pm"] = _en_dust;

    char buffer[256];
    size_t n = serializeJson(doc, buffer);
    if (_mqttClient.publish(topic.c_str(), (const uint8_t*)buffer, n, true)) { // Retained true para que siempre esté disponible
        SystemLogger::info("Configuracion de sensores notificada a la plataforma.");
    } else {
        SystemLogger::error("Fallo al notificar config.");
    }
}

void NetworkManager::publishTelemetry(JsonDocument& doc) {
    if (!isConnected() || _hmacToken.length() == 0) return;

    // Publicamos la config al menos una vez cuando se reporta telemetría (o al conectar)
    static bool configPublished = false;
    if (!configPublished) {
        publishDeviceConfig();
        configPublished = true;
    }

    String topic = "aqi/telemetry/" + _macAddress + "/data";
    char buffer[512];
    size_t n = serializeJson(doc, buffer);
    if (_mqttClient.publish(topic.c_str(), buffer, n)) {
        SystemLogger::debug("Telemetria publicada.");
    } else {
        SystemLogger::error("Fallo publicacion de telemetria.");
    }
}

void NetworkManager::performOTA(const char* url) {
    SystemLogger::info(String("Iniciando actualizacion OTA desde: ") + url);
    HTTPClient http;
    http.begin(url);
    
    int httpCode = http.GET();
    if (httpCode == HTTP_CODE_OK) {
        int contentLength = http.getSize();
        bool canBegin = Update.begin(contentLength);
        
        if (canBegin) {
            WiFiClient *client = http.getStreamPtr();
            size_t written = Update.writeStream(*client);
            
            if (written == contentLength) {
                SystemLogger::info("OTA Descargado. Aplicando y reiniciando...");
                if (Update.end()) {
                    ESP.restart();
                } else {
                    SystemLogger::error(String("Error en end(): ") + String(Update.getError()));
                }
            } else {
                SystemLogger::error("Descarga incompleta OTA.");
            }
        } else {
            SystemLogger::error("Espacio insuficiente para OTA.");
        }
    } else {
        SystemLogger::error(String("Error HTTP OTA: ") + String(httpCode));
    }
    http.end();
}

void NetworkManager::mqttCallbackWrapper(char* topic, byte* payload, unsigned int length) {
    if (globalNetworkManager) globalNetworkManager->mqttCallback(topic, payload, length);
}

void NetworkManager::mqttCallback(char* topic, byte* payload, unsigned int length) {
    String t = String(topic);
    
    // Loguear ABSOLUTAMENTE TODO lo que entra
    String debugMsg = ">>> [MQTT] Llego mensaje al topico: " + t;
    SystemLogger::debug(debugMsg.c_str());
    Serial.println(debugMsg);
    
    String responseTopic = "aqi/provisioning/response/" + _macAddress;
    String otaTopic = "aqi/commands/" + _macAddress + "/ota";
    String actuatorsTopic = "aqi/commands/" + _macAddress + "/actuators";
    String configTopic = "aqi/commands/" + _macAddress + "/config";

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    if (error) return;

    if (t == responseTopic) {
        if (doc.containsKey("mqtt_password")) {
            _hmacToken = String((const char*)doc["mqtt_password"]);
            _prefs.putString("hmac_token", _hmacToken);
            SystemLogger::info("Token HMAC recibido. Reconectando...");
            _mqttClient.disconnect();
        }
    } else if (t == actuatorsTopic) {
        if (_actuatorCb) {
            bool r1 = doc.containsKey("r1") ? doc["r1"].as<bool>() : false;
            bool r2 = doc.containsKey("r2") ? doc["r2"].as<bool>() : false;
            uint8_t pwm = doc.containsKey("pwm") ? doc["pwm"].as<uint8_t>() : 0;
            SystemLogger::debug("Comando de actuador recibido");
            _actuatorCb(r1, r2, pwm);
        }
    } else if (t == configTopic) {
        if (doc.containsKey("debug")) {
            bool debugMode = doc["debug"].as<bool>();
            SystemLogger::setDebug(debugMode);
            // Actualizar WiFiManager debug
            _wm.setDebugOutput(debugMode);
        }
        if (doc.containsKey("rules")) {
            SystemLogger::info("Recibida nueva configuracion de Motor de Reglas (Edge)");
            if (_rulesCb) {
                _rulesCb(doc["rules"].as<JsonArray>());
            }
        }
    } else if (t == otaTopic) {
        if (doc.containsKey("url")) {
            String url = doc["url"].as<String>();
            performOTA(url.c_str());
        }
    }
}

void NetworkManager::saveConfigCallbackWrapper() {
    if (globalNetworkManager) globalNetworkManager->saveConfig();
}

void NetworkManager::saveConfig() {
    SystemLogger::info("Guardando nueva configuracion desde WiFiManager...");
    _en_mq135 = (String(_param_mq135->getValue()) == "1");
    _en_bmp280 = (String(_param_bmp280->getValue()) == "1");
    _en_aht25 = (String(_param_aht25->getValue()) == "1");
    _en_ldr = (String(_param_ldr->getValue()) == "1");
    _en_bh1750 = (String(_param_bh1750->getValue()) == "1");
    _en_dust = (String(_param_dust->getValue()) == "1");

    _prefs.putBool("en_mq135", _en_mq135);
    _prefs.putBool("en_bmp280", _en_bmp280);
    _prefs.putBool("en_aht25", _en_aht25);
    _prefs.putBool("en_ldr", _en_ldr);
    _prefs.putBool("en_bh1750", _en_bh1750);
    _prefs.putBool("en_dust", _en_dust);

    SystemLogger::info("Configuracion guardada. Notificando a plataforma...");
    publishDeviceConfig(); // Notificar en el acto
}

void NetworkManager::loadConfig() {
    _en_mq135 = _prefs.getBool("en_mq135", true);
    _en_bmp280 = _prefs.getBool("en_bmp280", true);
    _en_aht25 = _prefs.getBool("en_aht25", true);
    _en_ldr = _prefs.getBool("en_ldr", false);
    _en_bh1750 = _prefs.getBool("en_bh1750", true);
    _en_dust = _prefs.getBool("en_dust", true);

    // Creamos campos HTML personalizados que emulan checkboxes robustos.
    // Usamos un campo de texto oculto que se sincroniza con el checkbox mediante JS.
    auto makeHtml = [](const char* id, bool val) -> String {
        String html = "type='hidden' id='h_";
        html += id;
        html += "' value='";
        html += val ? "1" : "0";
        html += "'><input type='checkbox' onchange='document.getElementById(\"h_";
        html += id;
        html += "\").value = this.checked ? \"1\" : \"0\";' ";
        html += val ? "checked" : "";
        html += ">";
        return html;
    };

    String h_mq = makeHtml("mq135", _en_mq135);
    String h_bmp = makeHtml("bmp280", _en_bmp280);
    String h_aht = makeHtml("aht25", _en_aht25);
    String h_ldr = makeHtml("ldr", _en_ldr);
    String h_bh = makeHtml("bh1750", _en_bh1750);
    String h_dust = makeHtml("dust", _en_dust);

    _param_mq135 = new WiFiManagerParameter("mq135", "Sensor de gases", _en_mq135 ? "1" : "0", 2, h_mq.c_str());
    _param_bmp280 = new WiFiManagerParameter("bmp280", "Sensor de presion y temp", _en_bmp280 ? "1" : "0", 2, h_bmp.c_str());
    _param_aht25 = new WiFiManagerParameter("aht25", "Sensor de temp y humedad", _en_aht25 ? "1" : "0", 2, h_aht.c_str());
    _param_ldr = new WiFiManagerParameter("ldr", "Sensor luz analogico", _en_ldr ? "1" : "0", 2, h_ldr.c_str());
    _param_bh1750 = new WiFiManagerParameter("bh1750", "Sensor luz digital", _en_bh1750 ? "1" : "0", 2, h_bh.c_str());
    _param_dust = new WiFiManagerParameter("dust", "Sensor de particulas PM10", _en_dust ? "1" : "0", 2, h_dust.c_str());

    // Mostrar Dirección MAC en el Portal para poder registrarla
    String macLabel = "<div style='margin-top:20px; padding:10px; background:#e2e8f0; border-radius:5px; text-align:center;'><b>Dirección MAC para Registro:</b><br><span style='font-family:monospace; font-size:16px; color:#0f172a;'>" + WiFi.macAddress() + "</span></div>";
    _param_mac = new WiFiManagerParameter(macLabel.c_str());

    _wm.addParameter(_param_mq135);
    _wm.addParameter(_param_bmp280);
    _wm.addParameter(_param_aht25);
    _wm.addParameter(_param_ldr);
    _wm.addParameter(_param_bh1750);
    _wm.addParameter(_param_dust);
    _wm.addParameter(_param_mac);
}
