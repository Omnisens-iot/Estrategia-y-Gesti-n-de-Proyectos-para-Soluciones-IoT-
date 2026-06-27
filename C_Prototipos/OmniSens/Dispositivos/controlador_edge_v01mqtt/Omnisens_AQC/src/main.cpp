#include <Arduino.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <esp_task_wdt.h>

#include "MQ135Sensor.h"
#include "AHT25Sensor.h"
#include "BMP280Sensor.h"
#include "LDRSensor.h"
#include "DustSensor.h"
#include "BH1750Sensor.h"
#include "SalidaPWM.h"
#include "SalidasRele.h"
#include "SensorData.h"
#include "LedIndicator.h"
#include "NetworkManager.h"
#include "SystemLogger.h"
#include "RulesEngine.h"

// Pines de Hardware
#define MQ135_PIN 39
#define PWM_PIN 32
#define RELE_1 33
#define RELE_2 25
#define LDR_PIN 36
#define DUST_AOUT_PIN 34 // Pin analógico para el sensor Sharp
#define DUST_ILED_PIN 4  // Pin digital para el LED del sensor Sharp
#define DUST_FAN_PIN 27  // Salida PWM exclusiva para el forzador de aire del sensor de Polvo
#define LED_PIN 2     // LED integrado en ESP32
#define BOOT_BTN 0    // Botón BOOT del ESP32
#define BATTERY_PIN 35 // Pin analógico divisor de batería

// Credenciales Base
const char* MQTT_BROKER = "3.90.242.143";
const uint16_t MQTT_PORT = 8883;

// Tiempo de Watchdog (15 segundos)
#define WDT_TIMEOUT 15

// Instancias de Hardware
MQ135Sensor mq135(MQ135_PIN);
AHT25Sensor aht25;
BMP280Sensor bmp280;
LDRSensor ldr(LDR_PIN);
DustSensor dust(DUST_AOUT_PIN, DUST_ILED_PIN);
BH1750Sensor bh1750;
SalidaPWM vel_motor(PWM_PIN); // Actuador externo genérico
SalidaPWM dust_fan(DUST_FAN_PIN); // Forzador dedicado para el sensor de polvo
SalidasRele salidas(RELE_1, RELE_2);
LedIndicator led(LED_PIN);

// Instancia de Lógica y Red
SensorData sensorData("AQC_001", &mq135, &bmp280, &aht25, &ldr, &dust, &bh1750, &salidas, &vel_motor, BATTERY_PIN);
NetworkManager network(MQTT_BROKER, MQTT_PORT, &led);
RulesEngine rulesEngine(&salidas, &vel_motor);

// FreeRTOS
SemaphoreHandle_t sensorMutex;
StaticJsonDocument<512> sharedDoc;
volatile bool newDataAvailable = false;

// Variables globales eliminadas, ya no se usan para el botón AP.

// --- Callback de Actuadores ---
void onActuatorCommand(bool r1, bool r2, uint8_t pwm) {
    SystemLogger::info(String("Aplicando Actuadores -> R1:") + String(r1) + " R2:" + String(r2) + " PWM:" + String(pwm));
    salidas.setRele1(r1);
    salidas.setRele2(r2);
    vel_motor.comandoPWM(pwm);
}

// --- Callback de Reglas (MQTT -> Borde) ---
void onRulesConfig(const JsonArray& rulesArray) {
    rulesEngine.saveRulesFromJson(rulesArray);
}

// ---------------------------------------------------------
// TAREA 1: Lectura de Sensores (Baja prioridad)
// ---------------------------------------------------------
void taskSensors(void *pvParameters) {
    esp_task_wdt_add(NULL);

    for (;;) {
        esp_task_wdt_reset();

        if (xSemaphoreTake(sensorMutex, portMAX_DELAY)) {
            // Sincronizar configuracion
            SensorConfig cfg;
            cfg.en_mq135 = network.enMq135();
            cfg.en_bmp280 = network.enBmp280();
            cfg.en_aht25 = network.enAht25();
            cfg.en_ldr = network.enLdr();
            cfg.en_bh1750 = network.enBh1750();
            cfg.en_dust = network.enDust();
            sensorData.setConfig(cfg);

            // Lógica de pre-calentamiento / purgado de aire para el sensor de polvo
            if (cfg.en_dust) {
                dust_fan.comandoPWM(180); // Encender forzador al ~70% de velocidad
                vTaskDelay(pdMS_TO_TICKS(1500)); // Esperar 1.5 segs para renovar el aire en el tubo
            }

            sharedDoc.clear();
            sensorData.populateJson(sharedDoc); // Aquí adentro se lee el sensor de polvo
            
            if (cfg.en_dust) {
                dust_fan.comandoPWM(0); // Apagar el forzador para ahorrar energía/ruido
            }

            // Evaluar reglas localmente contra los datos frescos
            rulesEngine.evaluate(sharedDoc);

            newDataAvailable = true;
            xSemaphoreGive(sensorMutex);
        }
        
        vTaskDelay(pdMS_TO_TICKS(5000)); // Repetir cada 5 segundos
    }
}

// ---------------------------------------------------------
// TAREA 2: Gestión de Red y Publicación MQTT (Alta prioridad)
// ---------------------------------------------------------
void taskNetwork(void *pvParameters) {
    esp_task_wdt_add(NULL);

    // El control del botón BOOT para el portal cautivo se movió a setup()
    // Esta tarea ahora solo se encarga de la conexión de red y telemetría.

    for (;;) {
        esp_task_wdt_reset();
        
        led.update();
        network.loop();

        if (newDataAvailable && network.isConnected()) {
            if (xSemaphoreTake(sensorMutex, pdMS_TO_TICKS(100))) {
                network.publishTelemetry(sharedDoc);
                newDataAvailable = false;
                xSemaphoreGive(sensorMutex);
            }
        }
        
        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

// --- SETUP ---
void setup() {
    Serial.begin(115200);
    delay(1000);

    // Configurar atenuación del ADC globalmente a 0dB (Rango: 0V a 1.1V aprox)
    // Esto asegura mayor linealidad y precisión para los divisores resistivos.
    analogSetAttenuation(ADC_0db);

    // Usar SystemLogger (primero llamamos begin explícito en NetworkManager pero no importa si lo usamos antes si es info default)
    SystemLogger::info("\n[Sistema] Iniciando OmniSens Edge Node...");

    // Inicializar Watchdog global
    esp_task_wdt_init(WDT_TIMEOUT, true);

    // Inicializar Botón, LED y Pin de Batería
    pinMode(BOOT_BTN, INPUT_PULLUP);
    pinMode(BATTERY_PIN, INPUT);
    led.begin();

    // Comprobar si el usuario quiere entrar al portal cautivo
    network.checkCaptivePortalBoot(BOOT_BTN, 5000);

    // Inicializar I2C
    Wire.setPins(21, 22);
    Wire.begin();

    // Inicializar Hardware
    aht25.begin();
    bmp280.begin();
    mq135.begin();
    ldr.begin();
    dust.begin();
    bh1750.begin();
    vel_motor.begin();
    vel_motor.comandoPWM(0);
    dust_fan.begin();
    dust_fan.comandoPWM(0);
    salidas.begin();

    // Inicializar Motor de Reglas
    rulesEngine.begin();

    sensorMutex = xSemaphoreCreateMutex();

    network.setActuatorCallback(onActuatorCommand);
    network.setRulesCallback(onRulesConfig);
    network.begin();

    xTaskCreatePinnedToCore(taskSensors, "TaskSensors", 4096, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(taskNetwork, "TaskNetwork", 8192, NULL, 2, NULL, 0);

    SystemLogger::info("Setup completado. RTOS en ejecucion con TWDT.");
}

void loop() {
    vTaskDelete(NULL);
}