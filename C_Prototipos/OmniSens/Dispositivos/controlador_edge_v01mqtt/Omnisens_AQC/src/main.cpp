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

// Pines de Hardware
#define MQ135_PIN 39
#define PWM_PIN 32
#define RELE_1 33
#define RELE_2 25
#define LDR_PIN 36
#define DUST_AOUT_PIN 34 // Pin analógico para el sensor Sharp
#define DUST_ILED_PIN 4  // Pin digital para el LED del sensor Sharp
#define LED_PIN 2     // LED integrado en ESP32
#define BOOT_BTN 0    // Botón BOOT del ESP32

// Credenciales Base
const char* MQTT_BROKER = "ispciot.org";
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
SalidaPWM vel_motor(PWM_PIN);
SalidasRele salidas(RELE_1, RELE_2);
LedIndicator led(LED_PIN);

// Instancia de Lógica y Red
SensorData sensorData("AQC_001", &mq135, &bmp280, &aht25, &ldr, &dust, &bh1750, &salidas, &vel_motor);
NetworkManager network(MQTT_BROKER, MQTT_PORT, &led);

// FreeRTOS
SemaphoreHandle_t sensorMutex;
StaticJsonDocument<512> sharedDoc;
volatile bool newDataAvailable = false;

// Variables Botón AP
unsigned long buttonPressTime = 0;
bool buttonPressed = false;

// --- Callback de Actuadores ---
void onActuatorCommand(bool r1, bool r2, uint8_t pwm) {
    SystemLogger::info(String("Aplicando Actuadores -> R1:") + String(r1) + " R2:" + String(r2) + " PWM:" + String(pwm));
    salidas.setRele1(r1);
    salidas.setRele2(r2);
    vel_motor.comandoPWM(pwm);
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

            sharedDoc.clear();
            sensorData.populateJson(sharedDoc);
            newDataAvailable = true;
            xSemaphoreGive(sensorMutex);
        }
        
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

// ---------------------------------------------------------
// TAREA 2: Gestión de Red y Publicación MQTT (Alta prioridad)
// ---------------------------------------------------------
void taskNetwork(void *pvParameters) {
    esp_task_wdt_add(NULL);

    // Asignar el callback antes de arrancar la red
    network.setActuatorCallback(onActuatorCommand);
    network.begin();

    for (;;) {
        esp_task_wdt_reset();

        // Chequear Botón para Portal Cautivo
        if (digitalRead(BOOT_BTN) == LOW) {
            if (!buttonPressed) {
                buttonPressed = true;
                buttonPressTime = millis();
            } else if (millis() - buttonPressTime > 3000) {
                network.startCaptivePortal();
                buttonPressed = false;
            }
        } else {
            buttonPressed = false;
        }

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

    // Usar SystemLogger (primero llamamos begin explícito en NetworkManager pero no importa si lo usamos antes si es info default)
    SystemLogger::info("\n[Sistema] Iniciando OmniSens Edge Node...");

    // Inicializar Watchdog global
    esp_task_wdt_init(WDT_TIMEOUT, true);

    // Inicializar Botón y LED
    pinMode(BOOT_BTN, INPUT_PULLUP);
    led.begin();

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
    salidas.begin();

    sensorMutex = xSemaphoreCreateMutex();

    xTaskCreatePinnedToCore(taskSensors, "TaskSensors", 4096, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(taskNetwork, "TaskNetwork", 8192, NULL, 2, NULL, 0);

    SystemLogger::info("Setup completado. RTOS en ejecucion con TWDT.");
}

void loop() {
    vTaskDelete(NULL);
}