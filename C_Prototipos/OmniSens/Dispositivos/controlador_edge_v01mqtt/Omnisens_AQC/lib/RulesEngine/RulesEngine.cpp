#include "RulesEngine.h"

RulesEngine::RulesEngine(SalidasRele* salidas, SalidaPWM* motor) 
    : _salidas(salidas), _motor(motor), _numRules(0) {
}

void RulesEngine::begin() {
    _prefs.begin("rules_engine", false);
    loadRules();
    SystemLogger::info(String("Motor de reglas iniciado. Reglas activas: ") + String(_numRules));
}

void RulesEngine::loadRules() {
    String rulesJson = _prefs.getString("rules", "[]");
    
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, rulesJson);
    
    if (error) {
        SystemLogger::error("Error al cargar reglas guardadas");
        _numRules = 0;
        return;
    }
    
    JsonArray array = doc.as<JsonArray>();
    _numRules = 0;
    
    for (JsonObject rule : array) {
        if (_numRules >= 10) break;
        
        _rules[_numRules].metric = rule["metric"].as<String>();
        _rules[_numRules].threshold = rule["threshold"].as<float>();
        _rules[_numRules].hysteresis = rule["hysteresis"].as<float>();
        _rules[_numRules].action = rule["action"].as<String>();
        
        // Asumimos que el array viene ordenado por prioridad desde la plataforma
        _rules[_numRules].priority = _numRules + 1; 
        
        _numRules++;
    }
}

void RulesEngine::saveRulesFromJson(const JsonArray& rulesArray) {
    JsonDocument doc;
    JsonArray destArray = doc.to<JsonArray>();
    
    for (JsonObject r : rulesArray) {
        destArray.add(r);
    }
    
    String rulesJson;
    serializeJson(doc, rulesJson);
    
    _prefs.putString("rules", rulesJson);
    loadRules(); // Recargar en memoria
    SystemLogger::info("Reglas guardadas y aplicadas exitosamente.");
}

void RulesEngine::executeAction(const String& action, bool state) {
    if (action == "r1") {
        _salidas->setRele1(state);
    } else if (action == "r2") {
        _salidas->setRele2(state);
    } else if (action == "pwm_100") {
        _motor->comandoPWM(state ? 255 : 0);
    } else if (action == "pwm_50") {
        _motor->comandoPWM(state ? 127 : 0);
    }
}

void RulesEngine::triggerFailsafe() {
    SystemLogger::error("[Failsafe] Sensor dañado o nulo detectado por el motor de reglas. Apagando actuadores.");
    _salidas->setRele1(false);
    _salidas->setRele2(false);
    _motor->comandoPWM(0);
}

void RulesEngine::evaluate(JsonDocument& telemetryDoc) {
    if (_numRules == 0) return;
    
    // Iteramos según prioridad (0 es la más alta en el array)
    for (uint8_t i = 0; i < _numRules; i++) {
        String m = _rules[i].metric;
        
        // Failsafe: Si la métrica ni siquiera está en el documento, o es nula
        if (telemetryDoc[m].isNull()) {
            triggerFailsafe();
            telemetryDoc["alarm_failsafe"] = true;
            continue; // Pasamos a la siguiente regla
        }
        
        float val = telemetryDoc[m].as<float>();
        
        if (val > _rules[i].threshold) {
            executeAction(_rules[i].action, true);
        } else if (val < _rules[i].hysteresis) {
            executeAction(_rules[i].action, false);
        }
    }
}
