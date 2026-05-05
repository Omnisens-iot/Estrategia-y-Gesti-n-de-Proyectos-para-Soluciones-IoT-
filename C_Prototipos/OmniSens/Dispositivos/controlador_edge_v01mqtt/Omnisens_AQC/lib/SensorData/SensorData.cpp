#include "SensorData.h"

SensorData::SensorData(const char* id, MQ135Sensor* mq, BMP280Sensor* bmp, AHT25Sensor* aht, LDRSensor* ldr, SalidasRele* rele, SalidaPWM* pwm)
    : _id(id), _mq(mq), _bmp(bmp), _aht(aht), _ldr(ldr), _rele(rele), _pwm(pwm) {}

void SensorData::populateJson(JsonDocument& doc) {
    float gas = _mq ? _mq->readFilteredData() : -1.0;
    int mq135_ok = (!isnan(gas) && gas > 0.0) ? 1 : 0;
    if (!mq135_ok) gas = -1.0;

    float temp_bmp = -1.0, presion = -1.0;
    int bmp280_ok = _bmp && _bmp->readData(temp_bmp, presion) ? 1 : 0;
    if (!bmp280_ok) {
        temp_bmp = -1.0;
        presion = -1.0;
    }

    float temp_aht = -1.0, humedad = -1.0;
    int aht25_ok = _aht && _aht->readData(temp_aht, humedad) ? 1 : 0;
    if (!aht25_ok) {
        temp_aht = -1.0;
        humedad = -1.0;
    }

    int luz = _ldr ? _ldr->read() : -1;
    int rele1 = _rele ? (_rele->getRele1() ? 1 : 0) : 0;
    int rele2 = _rele ? (_rele->getRele2() ? 1 : 0) : 0;
    uint8_t pwm = _pwm ? _pwm->getPWM() : 0;

    unsigned long ts = millis();

    // Llenar el documento JSON usando claves cortas para ahorrar ancho de banda MQTT
    // Alineado con el backend de OmniSens (Hito 2)
    doc["device_id"] = _id;
    //doc["tS"] = ts; // Backend pondrá timestamp propio
    doc["co2"] = gas; // Mapeado provisional
    doc["pm25"] = gas > 0 ? gas * 0.5 : 0; // Fake PM25 for testing backend
    doc["pm10"] = gas > 0 ? gas * 0.8 : 0; // Fake PM10 for testing backend
    doc["temp"] = temp_aht > 0 ? temp_aht : temp_bmp;
    doc["hum"] = humedad;
    doc["l"] = luz;
    doc["r1"] = rele1;
    doc["r2"] = rele2;
    doc["pwm"] = pwm;
}
