#ifndef DUSTSENSOR_H
#define DUSTSENSOR_H

#include <Arduino.h>

class DustSensor {
public:
    DustSensor(uint8_t aoutPin, uint8_t iledPin);
    void begin();
    
    // Devuelve la densidad de polvo en mg/m3
    // Toma múltiples muestras y devuelve el promedio si samples > 1
    float readDensity(uint8_t samples = 1);

private:
    uint8_t _aoutPin;
    uint8_t _iledPin;

    // Tiempos especificados en el datasheet del GP2Y1014AU0F
    const int samplingTime = 280;
    const int deltaTime = 40;
    const int sleepTime = 9680;
};

#endif
