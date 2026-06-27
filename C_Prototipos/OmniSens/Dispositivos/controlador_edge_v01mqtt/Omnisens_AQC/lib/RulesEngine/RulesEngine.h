#ifndef RULES_ENGINE_H
#define RULES_ENGINE_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "SalidasRele.h"
#include "SalidaPWM.h"
#include "SystemLogger.h"

struct Rule {
    String metric;
    float threshold;
    float hysteresis;
    String action;
    int priority;
};

class RulesEngine {
public:
    RulesEngine(SalidasRele* salidas, SalidaPWM* motor);
    void begin();
    
    // Evalúa todas las reglas contra la telemetría más reciente
    void evaluate(JsonDocument& telemetryDoc);
    
    // Guarda el JSON completo de reglas proveniente de la nube
    void saveRulesFromJson(const JsonArray& rulesArray);

private:
    SalidasRele* _salidas;
    SalidaPWM* _motor;
    Preferences _prefs;
    
    Rule _rules[10]; // Máximo 10 reglas concurrentes por ahora
    uint8_t _numRules;

    void loadRules();
    void executeAction(const String& action, bool state);
    void triggerFailsafe();
};

#endif
