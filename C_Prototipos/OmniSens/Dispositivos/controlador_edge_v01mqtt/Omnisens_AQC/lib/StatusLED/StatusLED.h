#ifndef STATUSLED_H
#define STATUSLED_H

#include <Adafruit_NeoPixel.h>

class StatusLED {
public:
    StatusLED(int pin, int numPixels);
    void begin();
    void setColor(int r, int g, int b);
    void show();

private:
    Adafruit_NeoPixel strip;
    int pin;
    int numPixels;
};

#endif
