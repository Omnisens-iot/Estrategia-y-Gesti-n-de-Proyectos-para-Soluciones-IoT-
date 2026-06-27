#include "SensorData.h"

SensorData::SensorData(const char* id, MQ135Sensor* mq, BMP280Sensor* bmp, AHT25Sensor* aht, LDRSensor* ldr, DustSensor* dust, BH1750Sensor* bh1750, SalidasRele* rele, SalidaPWM* pwm, int batteryPin)
    : _id(id), _mq(mq), _bmp(bmp), _aht(aht), _ldr(ldr), _dust(dust), _bh1750(bh1750), _rele(rele), _pwm(pwm), _batteryPin(batteryPin) {}

void SensorData::setConfig(SensorConfig config) {
    _config = config;
}

void SensorData::populateJson(JsonDocument& doc) {
    doc["device_id"] = _id;
    
    if (_config.en_mq135) {
        float gas = (_mq && _config.en_mq135) ? _mq->readFilteredData() : -1.0;
        int mq135_ok = (!isnan(gas) && gas > 0.0) ? 1 : 0;
        if (!mq135_ok) gas = -1.0;
        doc["co2"] = gas; // Mapeado provisional
    }

    if (_config.en_dust) {
        float dust = _dust ? _dust->readDensity(5) : -1.0; // Promedio de 5 muestras
        doc["pm10"] = dust >= 0 ? dust * 1000.0 : -1.0; // Conversión a ug/m3
    }
    
    // Dejamos PM2.5 desactivado, pero lo mandamos en el payload si está activo o simplemente omitido.
    // doc["pm25"] = -1; // Desactivado por ahora, la plataforma lo maneja abierto.
    
    if (_config.en_aht25 || _config.en_bmp280) {
        float temp_bmp = -1.0, presion = -1.0;
        int bmp280_ok = (_bmp && _config.en_bmp280) ? _bmp->readData(temp_bmp, presion) : 0;
        if (!bmp280_ok) { temp_bmp = -1.0; presion = -1.0; }

        float temp_aht = -1.0, humedad = -1.0;
        int aht25_ok = (_aht && _config.en_aht25) ? _aht->readData(temp_aht, humedad) : 0;
        if (!aht25_ok) { temp_aht = -1.0; humedad = -1.0; }

        doc["temp"] = temp_aht > 0 ? temp_aht : temp_bmp;
        doc["hum"] = humedad;
        if (bmp280_ok) doc["pres"] = presion;
    }

    if (_config.en_ldr) {
        int luz = _ldr ? _ldr->read() : -1;
        doc["l"] = luz;
    }

    if (_config.en_bh1750) {
        float lux = _bh1750 ? _bh1750->readLightLevel() : -1.0;
        doc["lux"] = lux;
    }

    int rele1 = _rele ? (_rele->getRele1() ? 1 : 0) : 0;
    int rele2 = _rele ? (_rele->getRele2() ? 1 : 0) : 0;
    uint8_t pwm = _pwm ? _pwm->getPWM() : 0;

    doc["r1"] = rele1;
    doc["r2"] = rele2;
    doc["pwm"] = pwm;

    if (_batteryPin >= 0) {
        int raw = analogRead(_batteryPin);
        // Divisor resistivo 33k/10k (factor de atenuación = 4.3). Referencia ADC de 1.0V (0dB).
        float volt = (raw / 4095.0) * 1.0 * 4.3;
        if (volt < 0.0) volt = 0.0;
        doc["battery"] = volt;
    }
}
