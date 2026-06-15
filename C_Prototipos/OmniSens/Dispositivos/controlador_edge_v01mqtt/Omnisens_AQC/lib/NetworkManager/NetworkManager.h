#ifndef NETWORK_MANAGER_H
#define NETWORK_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <Update.h>
#include <LedIndicator.h>
#include <SystemLogger.h>

// Definición del tipo de CallBack para actuadores
typedef void (*ActuatorCallback)(bool r1, bool r2, uint8_t pwm);

class NetworkManager {
public:
    NetworkManager(const char* broker, uint16_t port, LedIndicator* led);
    
    void begin();
    void loop();
    bool isConnected();
    void publishTelemetry(JsonDocument& doc);
    void publishDeviceConfig(); // Notificar a la plataforma la configuración
    
    // Getters para configuración
    bool enMq135() { return _en_mq135; }
    bool enBmp280() { return _en_bmp280; }
    bool enAht25() { return _en_aht25; }
    bool enLdr() { return _en_ldr; }
    bool enBh1750() { return _en_bh1750; }
    bool enDust() { return _en_dust; }
    
    // Setters
    void setActuatorCallback(ActuatorCallback cb);
    
    // Portal Cautivo a demanda
    void startCaptivePortal();
    
    // Actualización OTA remota
    void performOTA(const char* url);

private:
    const char* _broker;
    uint16_t _port;
    LedIndicator* _led;
    ActuatorCallback _actuatorCb = nullptr;
    
    WiFiClientSecure _wifiClient;
    PubSubClient _mqttClient;
    Preferences _prefs;
    WiFiManager _wm;

    // Configuración de Sensores
    bool _en_mq135 = true;
    bool _en_bmp280 = true;
    bool _en_aht25 = true;
    bool _en_ldr = false;
    bool _en_bh1750 = true;
    bool _en_dust = true;
    
    WiFiManagerParameter* _param_mq135;
    WiFiManagerParameter* _param_bmp280;
    WiFiManagerParameter* _param_aht25;
    WiFiManagerParameter* _param_ldr;
    WiFiManagerParameter* _param_bh1750;
    WiFiManagerParameter* _param_dust;
    WiFiManagerParameter* _param_mac;

    String _macAddress;
    String _hmacToken;

    unsigned long _lastReconnectAttempt = 0;
    bool _portalRunning = false;
    
    void connectWiFi();
    void connectMQTT();
    void mqttCallback(char* topic, byte* payload, unsigned int length);
    static void mqttCallbackWrapper(char* topic, byte* payload, unsigned int length);
    void loadConfig();
    void saveConfig();
    static void saveConfigCallbackWrapper();
};

// Singleton pointer for the wrapper
extern NetworkManager* globalNetworkManager;

#endif
