#include "LedIndicator.h"

LedIndicator::LedIndicator(uint8_t pin) : _pin(pin), _state(LED_OFF), _previousMillis(0), _ledStatus(false) {}

void LedIndicator::begin() {
    pinMode(_pin, OUTPUT);
    digitalWrite(_pin, LOW);
}

void LedIndicator::setMode(LedState state) {
    _state = state;
    if (state == LED_OFF) {
        _ledStatus = false;
        digitalWrite(_pin, LOW);
    } else if (state == LED_ON) {
        _ledStatus = true;
        digitalWrite(_pin, HIGH);
    }
}

void LedIndicator::update() {
    unsigned long currentMillis = millis();

    switch (_state) {
        case LED_AP_MODE:
            // Parpadeo rápido (100ms)
            if (currentMillis - _previousMillis >= 100) {
                _previousMillis = currentMillis;
                _ledStatus = !_ledStatus;
                digitalWrite(_pin, _ledStatus ? HIGH : LOW);
            }
            break;

        case LED_CONNECTING:
            // Parpadeo lento (500ms)
            if (currentMillis - _previousMillis >= 500) {
                _previousMillis = currentMillis;
                _ledStatus = !_ledStatus;
                digitalWrite(_pin, _ledStatus ? HIGH : LOW);
            }
            break;

        case LED_CONNECTED:
            // Breve destello de 50ms cada 5 segundos (Heartbeat)
            if (_ledStatus && (currentMillis - _previousMillis >= 50)) {
                _ledStatus = false;
                digitalWrite(_pin, LOW);
                _previousMillis = currentMillis;
            } else if (!_ledStatus && (currentMillis - _previousMillis >= 5000)) {
                _ledStatus = true;
                digitalWrite(_pin, HIGH);
                _previousMillis = currentMillis;
            }
            break;

        default:
            break;
    }
}
