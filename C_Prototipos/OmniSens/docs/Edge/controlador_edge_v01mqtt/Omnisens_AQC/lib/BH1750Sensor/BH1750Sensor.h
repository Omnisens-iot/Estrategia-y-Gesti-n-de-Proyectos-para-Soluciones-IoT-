#ifndef BH1750SENSOR_H
#define BH1750SENSOR_H

#include <Arduino.h>
#include <BH1750.h>
#include <Wire.h>

class BH1750Sensor {
public:
    BH1750Sensor();
    bool begin();
    float readLightLevel();

private:
    BH1750 lightMeter;
};

#endif
