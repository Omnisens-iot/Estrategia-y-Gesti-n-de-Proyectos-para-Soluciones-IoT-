#include "BH1750Sensor.h"

BH1750Sensor::BH1750Sensor() {
    // Constructor
}

bool BH1750Sensor::begin() {
    Wire.begin();
    return lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
}

float BH1750Sensor::readLightLevel() {
    if (lightMeter.measurementReady()) {
        return lightMeter.readLightLevel();
    }
    return -1; // Return -1 if measurement is not ready
}
