#include "SystemLogger.h"

bool SystemLogger::_debugEnabled = true;

void SystemLogger::begin() {
    Preferences prefs;
    prefs.begin("omnisens", true); // Modo lectura
    _debugEnabled = prefs.getBool("debug_mode", true); // Por defecto true
    prefs.end();
}

void SystemLogger::setDebug(bool enabled) {
    if (_debugEnabled != enabled) {
        _debugEnabled = enabled;
        Preferences prefs;
        prefs.begin("omnisens", false); // Modo escritura
        prefs.putBool("debug_mode", _debugEnabled);
        prefs.end();
        Serial.printf("[LOGGER] Modo debug %s\n", enabled ? "ACTIVADO" : "DESACTIVADO");
    }
}

bool SystemLogger::isDebugEnabled() {
    return _debugEnabled;
}

void SystemLogger::info(const char* msg) {
    Serial.printf("[INFO] %s\n", msg);
}

void SystemLogger::info(String msg) {
    Serial.printf("[INFO] %s\n", msg.c_str());
}

void SystemLogger::debug(const char* msg) {
    if (_debugEnabled) {
        Serial.printf("[DEBUG] %s\n", msg);
    }
}

void SystemLogger::debug(String msg) {
    if (_debugEnabled) {
        Serial.printf("[DEBUG] %s\n", msg.c_str());
    }
}

void SystemLogger::error(const char* msg) {
    Serial.printf("[ERROR] %s\n", msg);
}

void SystemLogger::error(String msg) {
    Serial.printf("[ERROR] %s\n", msg.c_str());
}
