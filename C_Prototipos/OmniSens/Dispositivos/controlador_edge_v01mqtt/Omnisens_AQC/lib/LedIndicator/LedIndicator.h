#ifndef LED_INDICATOR_H
#define LED_INDICATOR_H

#include <Arduino.h>

enum LedState {
    LED_OFF,
    LED_ON,
    LED_AP_MODE,
    LED_CONNECTING,
    LED_CONNECTED
};

class LedIndicator {
public:
    LedIndicator(uint8_t pin);
    void begin();
    void setMode(LedState state);
    void update();

private:
    uint8_t _pin;
    LedState _state;
    unsigned long _previousMillis;
    bool _ledStatus;
};

#endif
