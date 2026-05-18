#ifndef SENSORDATA_H
#define SENSORDATA_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <MQ135Sensor.h>
#include <BMP280Sensor.h>
#include <AHT25Sensor.h>
#include <LDRSensor.h>
#include <DustSensor.h>
#include <BH1750Sensor.h>
#include <SalidasRele.h>
#include <SalidaPWM.h>

struct SensorConfig {
    bool en_mq135 = true;
    bool en_bmp280 = true;
    bool en_aht25 = true;
    bool en_ldr = true;
    bool en_bh1750 = true;
    bool en_dust = true;
};

class SensorData {
public:
    SensorData(const char* id, MQ135Sensor* mq, BMP280Sensor* bmp, AHT25Sensor* aht, LDRSensor* ldr,
               DustSensor* dust, BH1750Sensor* bh1750, SalidasRele* rele, SalidaPWM* pwm);

    void setConfig(SensorConfig config);

    // En lugar de devolver un String que fragmenta el Heap,
    // inyectamos los datos en un JsonDocument pre-alocado por referencia.
    void populateJson(JsonDocument& doc);

private:
    const char* _id;
    MQ135Sensor* _mq;
    BMP280Sensor* _bmp;
    AHT25Sensor* _aht;
    LDRSensor* _ldr;
    DustSensor* _dust;
    BH1750Sensor* _bh1750;
    SalidasRele* _rele;
    SalidaPWM* _pwm;

    SensorConfig _config;
};

#endif
