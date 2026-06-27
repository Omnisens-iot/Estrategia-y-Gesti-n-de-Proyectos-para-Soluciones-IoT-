CREATE TABLE IF NOT EXISTS device_rules (
    rule_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id) ON DELETE CASCADE,
    metric VARCHAR(50) NOT NULL,
    threshold NUMERIC NOT NULL,
    hysteresis NUMERIC NOT NULL,
    action VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
