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

    String _macAddress;
    String _hmacToken;

    unsigned long _lastReconnectAttempt = 0;
    bool _portalRunning = false;
    
    void connectWiFi();
    void connectMQTT();
    void mqttCallback(char* topic, byte* payload, unsigned int length);
    static void mqttCallbackWrapper(char* topic, byte* payload, unsigned int length);
};

// Singleton pointer for the wrapper
extern NetworkManager* globalNetworkManager;

#endif
