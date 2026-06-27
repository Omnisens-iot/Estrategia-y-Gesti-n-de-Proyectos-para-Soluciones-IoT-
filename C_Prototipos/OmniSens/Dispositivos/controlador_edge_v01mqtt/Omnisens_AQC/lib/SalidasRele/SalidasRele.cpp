#include "SalidasRele.h"

SalidasRele::SalidasRele(int pin1, int pin2)
    : _pin1(pin1), _pin2(pin2), _estado1(false), _estado2(false) {}

void SalidasRele::begin() {
    // Escribir HIGH antes de configurar como OUTPUT para evitar pulsos erráticos en el arranque
    digitalWrite(_pin1, HIGH);
    pinMode(_pin1, OUTPUT);
    digitalWrite(_pin2, HIGH);
    pinMode(_pin2, OUTPUT);
    
    // Inicializar variables de estado lógico
    _estado1 = false;
    _estado2 = false;
}

void SalidasRele::setRele1(bool estado) {
    _estado1 = estado;
    // Lógica Activo-Bajo: estado true (encendido) = LOW, estado false (apagado) = HIGH
    digitalWrite(_pin1, estado ? LOW : HIGH);
}

void SalidasRele::setRele2(bool estado) {
    _estado2 = estado;
    // Lógica Activo-Bajo: estado true (encendido) = LOW, estado false (apagado) = HIGH
    digitalWrite(_pin2, estado ? LOW : HIGH);
}

void SalidasRele::toggleRele1() {
    setRele1(!_estado1);
}

void SalidasRele::toggleRele2() {
    setRele2(!_estado2);
}

bool SalidasRele::getRele1() const {
    return _estado1;
}

bool SalidasRele::getRele2() const {
    return _estado2;
}