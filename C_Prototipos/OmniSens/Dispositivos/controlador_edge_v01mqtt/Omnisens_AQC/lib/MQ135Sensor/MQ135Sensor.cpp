#include "MQ135Sensor.h"

// Inicializa MQUnifiedsensor con la placa, voltaje del ADC (1.0V para 0dB), resolución ADC 12-bit, el pin y el modelo.
MQ135Sensor::MQ135Sensor(int pin) : mq135("ESP-32", 1.0, 12, pin, "MQ-135") {}

bool MQ135Sensor::begin() {
    for (int i = 0; i < NUM_READINGS; i++) {
        mq135Readings[i] = 0;
    }
    
    // Configuración para CO2
    mq135.setRegressionMethod(1); // _PPM =  a*ratio^b
    mq135.setA(110.47); 
    mq135.setB(-2.862);
    
    // Inicialización
    mq135.init(); 

    // Asumimos que RL es de 1kOhm (1.0) como indicó el usuario en su módulo
    mq135.setRL(1.0);

    // Calibración inicial de R0 (Asumiendo ambiente de aire limpio)
    Serial.println("Calibrando MQ-135...");
    float calcR0 = 0;
    for(int i = 1; i <= 10; i ++) {
        mq135.update(); // Muestrea
        calcR0 += mq135.calibrate(3.6); // Ratio para aire limpio en MQ135
        delay(100);
    }
    mq135.setR0(calcR0/10);
    
    if(isinf(calcR0) || calcR0 == 0) {
        Serial.println("Warning: Calibracion MQ135 dio infinito (Voltaje < 50mV en zona muerta ADC). Usando R0 = 40.0 de rescate.");
        mq135.setR0(40.0);
        // Retornamos true igual para que siga funcionando y detecte cuando haya MUCHO gas y suba el voltaje.
        return true;
    }
    
    return true;
}

float MQ135Sensor::readFilteredData() {
    // Tomar nueva muestra del ADC y actualizar voltaje interno
    mq135.update();
    
    // Calcular PPM usando el método de regresión
    float gas = mq135.readSensor();

    // Actualizar la media móvil
    mq135Total -= mq135Readings[mq135ReadIndex];
    mq135Readings[mq135ReadIndex] = gas;
    mq135Total += mq135Readings[mq135ReadIndex];
    mq135ReadIndex = (mq135ReadIndex + 1);
    if (mq135ReadIndex == NUM_READINGS) {
        mq135ReadIndex = 0;
    }
    mq135Average = mq135Total / NUM_READINGS;

    // Filtrado de datos erróneos extremos
    if (mq135Average < 0 || mq135Average > 10000) {
        return -1;
    }

    return mq135Average;
}