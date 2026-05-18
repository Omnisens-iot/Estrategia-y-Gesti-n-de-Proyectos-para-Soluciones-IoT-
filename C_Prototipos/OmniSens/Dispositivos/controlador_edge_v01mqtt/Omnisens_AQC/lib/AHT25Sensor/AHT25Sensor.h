#ifndef AHT25SENSOR_H
#define AHT25SENSOR_H

#include <Arduino.h>

#if defined(__has_include)
  #if __has_include(<Adafruit_AHTX0.h>)
    #include <Adafruit_AHTX0.h>
  #elif __has_include("Adafruit_AHTX0.h")
    #include "Adafruit_AHTX0.h"
  #else
    #error "Adafruit_AHTX0.h not found. Install the Adafruit AHTX0 library or add it to the include path."
  #endif
#else
  #include <Adafruit_AHTX0.h>
#endif

class AHT25Sensor {
private:
    Adafruit_AHTX0 aht;

public:
    AHT25Sensor();
    bool begin();
    bool readData(float &temperature, float &humidity);
};

#endif
