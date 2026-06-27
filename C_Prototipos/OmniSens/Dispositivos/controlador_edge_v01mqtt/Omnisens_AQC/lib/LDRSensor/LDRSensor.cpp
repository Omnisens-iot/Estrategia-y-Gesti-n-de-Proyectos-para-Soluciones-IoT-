#include "LDRSensor.h"

LDRSensor::LDRSensor(int pin) : _pin(pin) {}

void LDRSensor::begin() {
    pinMode(_pin, INPUT);
    
}

int LDRSensor::read() {
    return analogRead(_pin);
}

float LDRSensor::readLux() {
    int value = analogRead(_pin);
    // Voltaje leído en el pin ADC (rango 0-1.0V para 0dB)
    float v_adc = (value / 4095.0) * 1.0; 

    // Protección de límites para evitar divisiones por cero o valores negativos
    if (v_adc <= 0.01) v_adc = 0.01; // Máxima luz (LDR casi 0 ohms)
    if (v_adc >= 1.03) v_adc = 1.029; // Oscuridad total (teórico max es 1.03125V)

    // Cálculo de la resistencia equivalente del LDR basándose en el circuito:
    // 3.3V -- R_22k -- (V_adc) -- [LDR // R_10k] -- GND
    float term1 = (3.3 - v_adc) / (22000.0 * v_adc);
    float term2 = 1.0 / 10000.0;
    
    float ldr_ohms = 1.0 / (term1 - term2);

    // Evitar valores irreales en la resistencia
    if (ldr_ohms < 50.0) ldr_ohms = 50.0;
    if (ldr_ohms > 2000000.0) ldr_ohms = 2000000.0;

    // Aproximación estándar para LDR tipo GL5528 (Lux = 500000 * R^(-1.25))
    // Ajustado para dar resultados razonables y similares al BH1750
    float lux = 500000.0 * pow(ldr_ohms, -1.25);
    
    return lux;
}