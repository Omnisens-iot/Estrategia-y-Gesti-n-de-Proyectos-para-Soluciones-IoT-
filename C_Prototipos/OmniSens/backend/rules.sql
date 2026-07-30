CREATE TABLE IF NOT EXISTS device_rules (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL REFERENCES devices(device_id),
    metric VARCHAR(50) NOT NULL,
    threshold FLOAT NOT NULL,
    condition VARCHAR(10) NOT NULL,
    chat_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
