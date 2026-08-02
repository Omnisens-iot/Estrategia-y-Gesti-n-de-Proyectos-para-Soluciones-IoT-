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
    SystemLogger::info(String("[Reglas] ") + String(_numRules) + " reglas cargadas.");
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

void RulesEngine::evaluate(JsonDocument& telemetryDoc) {
    if (_numRules == 0) return;
    
    // Obtener el estado actual
    bool nextR1 = _salidas->getRele1();
    bool nextR2 = _salidas->getRele2();
    uint8_t nextPWM = _motor->getPWM();
    bool failsafeActivo = false;
    
    // Iteramos según prioridad (0 es la más alta en el array)
    for (uint8_t i = 0; i < _numRules; i++) {
        String m = _rules[i].metric;
        
        // Failsafe: Si la métrica ni siquiera está en el documento, o es nula
        if (telemetryDoc[m].isNull()) {
            failsafeActivo = true;
            telemetryDoc["alarm_failsafe"] = true;
            continue; // Pasamos a la siguiente regla
        }
        
        float val = telemetryDoc[m].as<float>();
        bool debeAplicar = false;
        bool estadoDeseado = false;
        
        if (val > _rules[i].threshold) {
            SystemLogger::debug(String("[Reglas] ") + m + " (" + String(val) + ") > umbral (" + String(_rules[i].threshold) + ").");
            debeAplicar = true;
            estadoDeseado = true;
        } else if (val < _rules[i].hysteresis) {
            SystemLogger::debug(String("[Reglas] ") + m + " (" + String(val) + ") < histeresis (" + String(_rules[i].hysteresis) + ").");
            debeAplicar = true;
            estadoDeseado = false;
        }
        
        if (debeAplicar) {
            String action = _rules[i].action;
            if (action == "r1") nextR1 = estadoDeseado;
            else if (action == "r2") nextR2 = estadoDeseado;
            else if (action == "pwm_100") nextPWM = estadoDeseado ? 100 : 0; // comandoPWM espera porcentaje (0-100)
            else if (action == "pwm_50") nextPWM = estadoDeseado ? 50 : 0;
        }
    }
    
    if (failsafeActivo) {
        SystemLogger::error("[Failsafe] Sensor dañado o nulo detectado por el motor de reglas. Apagando actuadores.");
        nextR1 = false;
        nextR2 = false;
        nextPWM = 0;
    }
    
    // Aplicar solo si el estado cambió (evita pulsos)
    if (nextR1 != _salidas->getRele1()) {
        SystemLogger::info(String("[Reglas] Cambio R1 -> ") + (nextR1 ? "ON" : "OFF"));
        _salidas->setRele1(nextR1);
    }
    
    if (nextR2 != _salidas->getRele2()) {
        SystemLogger::info(String("[Reglas] Cambio R2 -> ") + (nextR2 ? "ON" : "OFF"));
        _salidas->setRele2(nextR2);
    }
    
    if (nextPWM != _motor->getPWM()) {
        SystemLogger::info(String("[Reglas] Cambio PWM -> ") + String(nextPWM) + "%");
        _motor->comandoPWM(nextPWM);
    }
}

