#include "NetworkManager.h"
#include <SystemLogger.h>

// Placeholder para CA Cert
const char* rootCACertificate = \
"-----BEGIN CERTIFICATE-----\n" \
"MIICiTCCAg+gAwIBAgIQH0evqm1B2lIAAAAAAAAANjAKBggqhkjOPQQDAzBSMQsw\n" \
"CQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMSwwKgYDVQQDEyNEaWdp\n" \
"Q2VydCBHbG9iYWwgUm9vdCBHMyBFQ0MgU0hBMzg0MB4XDTIxMDQwODEyMTE1MVoX\n" \
"DTI2MDQwODEyMTExNVowSjELMAkGA1UEBhMCVVMxFTATBgNVBAoTDERpZ2lDZXJ0\n" \
"IEluYzEkMCIGA1UEAxMbRGlnaUNlcnQgVExTIEVDQyBTSEEzODQgRzQwWTATBgcq\n" \
"hkjOPQIBBggqhkjOPQMBBwNCAAR1/7yX9X5HnF9Jvj194f42I1I35r+h8p51T83w\n" \
"Gf5n0980r/n+7E2E0aXq6B+tF6K1p2vO1o2QnL1P1bQO9C7Co4IBXTCCAVkwHQYD\n" \
"VR0OBBYEFN/Q/M29Z11P2T1fM69R6lP7fW9JMB8GA1UdIwQYMBaAFL3Iwwx7U2f1\n" \
"E8f5n7T8Q5b4n5v5MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGG\n" \
"MDMGA1UdHwQsMCowKKAmoCSGImh0dHA6Ly9jcmwzLmRpZ2ljZXJ0LmNvbS9HMy1S\n" \
"b290LmNybDBtBggrBgEFBQcBAQRhMF8wJgYIKwYBBQUHMAGGGmh0dHA6Ly9vY3Nw\n" \
"LmRpZ2ljZXJ0LmNvbTA1BggrBgEFBQcwAoYpaHR0cDovL2NhY2VydHMuZGlnaWNl\n" \
"cnQuY29tL0czLVJvb3QuY3J0MHcGA1UdIARwMG4wZAYKYIZIAYb9bAIBBDBWMCMG\n" \
"CCsGAQUFBwIBFhdodHRwczovL3d3dy5kaWdpY2VydC5jb20vQ1BTMC8GCCsGAQUF\n" \
"BwICMCMaIUFueSB1c2Ugb2YgdGhpcyBDZXJ0aWZpY2F0ZSBjb25zMAMGA1UdJwQC\n" \
"MAAwCgYIKoZIzj0EAwMDZwAwZAIwP4T9Vv44sI9X7u1Z2U4r8o+n8d5L9v8J9f7m\n" \
"P7K3/8k+P9E9L5B5V1P0P4c9R5b5AjBv6N5b1L8Z9P9O9R2s+T9O9r+u+d8P7m\n" \
"9X5HnF9Jvj194f42I1I35r+h8p51T83w==\n" \
"-----END CERTIFICATE-----\n";

NetworkManager* globalNetworkManager = nullptr;

NetworkManager::NetworkManager(const char* broker, uint16_t port, LedIndicator* led)
    : _broker(broker), _port(port), _led(led) {
    globalNetworkManager = this;
}

void NetworkManager::begin() {
    SystemLogger::begin(); // Inicializar estado de logs
    _wifiClient.setCACert(rootCACertificate);
    _mqttClient.setClient(_wifiClient);
    _mqttClient.setServer(_broker, _port);
    _mqttClient.setCallback(NetworkManager::mqttCallbackWrapper);
    _mqttClient.setBufferSize(512);

    _macAddress = WiFi.macAddress();
    _macAddress.replace(":", "");

    _prefs.begin("omnisens", false);
    _hmacToken = _prefs.getString("hmac_token", "");

    _wm.setDebugOutput(SystemLogger::isDebugEnabled());
    _wm.setConfigPortalBlocking(false); 

    connectWiFi();
}

void NetworkManager::setActuatorCallback(ActuatorCallback cb) {
    _actuatorCb = cb;
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

void NetworkManager::startCaptivePortal() {
    SystemLogger::info("Iniciando Portal Cautivo a demanda...");
    _led->setMode(LED_AP_MODE);
    _wm.setConfigPortalBlocking(false);
    _wm.startConfigPortal("Omnisens-Setup");
    _portalRunning = true;
}

bool NetworkManager::isConnected() {
    return WiFi.status() == WL_CONNECTED && _mqttClient.connected();
}

void NetworkManager::connectWiFi() {
    SystemLogger::info("Conectando a WiFi...");
    _led->setMode(LED_CONNECTING);
    
    if (_wm.autoConnect("Omnisens-Setup")) {
        SystemLogger::info("WiFi Conectado!");
    } else {
        SystemLogger::error("No se pudo conectar a WiFi. Usa el boton para Portal Cautivo.");
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

void NetworkManager::publishTelemetry(JsonDocument& doc) {
    if (!isConnected() || _hmacToken.length() == 0) return;

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
    } else if (t == otaTopic) {
        if (doc.containsKey("url")) {
            String url = doc["url"].as<String>();
            performOTA(url.c_str());
        }
    }
}
