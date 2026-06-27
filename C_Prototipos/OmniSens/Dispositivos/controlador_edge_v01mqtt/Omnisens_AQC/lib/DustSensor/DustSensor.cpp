#include "DustSensor.h"

DustSensor::DustSensor(uint8_t aoutPin, uint8_t iledPin) {
    _aoutPin = aoutPin;
    _iledPin = iledPin;
}

void DustSensor::begin() {
    pinMode(_iledPin, OUTPUT);
    digitalWrite(_iledPin, LOW); // Apagado por defecto (Conexión directa, sin PNP)
    pinMode(_aoutPin, INPUT);
}

float DustSensor::readDensity(uint8_t samples) {
    if (samples == 0) samples = 1;
    float sumDensity = 0.0;

    for (uint8_t i = 0; i < samples; i++) {
        // 1. Encender el LED IR (Nivel ALTO porque se conectó directo sin transistor)
        digitalWrite(_iledPin, HIGH);
        delayMicroseconds(samplingTime);

        // 2. Leer el valor analógico
        int voMeasured = analogRead(_aoutPin);

        // 3. Apagar el LED IR
        delayMicroseconds(deltaTime);
        digitalWrite(_iledPin, LOW);
        delayMicroseconds(sleepTime);

        // 4. Calcular voltaje (ESP32 ADC es de 12 bits, 0-4095. Referencia ~1.0V a 0dB)
        // Nota: El divisor resistivo físico es 38.6k/10k (factor = 4.86)
        float calcVoltage = voMeasured * (1.0 / 4095.0) * 4.86;

        // 5. Calcular densidad en mg/m3 según datasheet (0.17 * V - 0.1)
        // Ecuación típica de calibración de Chris Nafis para este sensor
        float dustDensity = 0.17 * calcVoltage - 0.1;

        if (dustDensity < 0) {
            dustDensity = 0.0;
        }

        sumDensity += dustDensity;
    }

    return sumDensity / samples;
}
