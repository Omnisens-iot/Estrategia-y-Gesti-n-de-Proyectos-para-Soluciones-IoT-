#ifndef SYSTEM_LOGGER_H
#define SYSTEM_LOGGER_H

#include <Arduino.h>
#include <Preferences.h>

class SystemLogger {
public:
    static void begin();
    static void setDebug(bool enabled);
    static bool isDebugEnabled();

    // Mensajes de flujo general (siempre visibles)
    static void info(const char* msg);
    static void info(String msg);
    
    // Mensajes de depuración (solo visibles si debug == true)
    static void debug(const char* msg);
    static void debug(String msg);
    
    // Mensajes de error (siempre visibles)
    static void error(const char* msg);
    static void error(String msg);

private:
    static bool _debugEnabled;
};

#endif
