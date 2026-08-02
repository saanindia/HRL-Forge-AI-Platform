"""Seed knowledge-base data on startup (idempotent)."""
from database import get_db

BOARDS = [
    {"slug": "arduino-uno", "name": "Arduino Uno R3", "family": "arduino", "mcu": "ATmega328P",
     "clock": "16 MHz", "flash": "32 KB", "ram": "2 KB", "gpio": 14, "voltage": "5V",
     "interfaces": ["UART", "I2C", "SPI"], "languages": ["Arduino C++", "PlatformIO"],
     "description": "The classic Arduino board. Perfect for learning and prototyping.",
     "image": "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400"},
    {"slug": "arduino-nano", "name": "Arduino Nano", "family": "arduino", "mcu": "ATmega328P",
     "clock": "16 MHz", "flash": "32 KB", "ram": "2 KB", "gpio": 22, "voltage": "5V",
     "interfaces": ["UART", "I2C", "SPI"], "languages": ["Arduino C++", "PlatformIO"],
     "description": "Compact breadboard-friendly variant of the Uno.",
     "image": "https://images.unsplash.com/photo-1601739099918-5f9e1eb5ba52?w=400"},
    {"slug": "arduino-mega", "name": "Arduino Mega 2560", "family": "arduino", "mcu": "ATmega2560",
     "clock": "16 MHz", "flash": "256 KB", "ram": "8 KB", "gpio": 54, "voltage": "5V",
     "interfaces": ["UART x4", "I2C", "SPI"], "languages": ["Arduino C++", "PlatformIO"],
     "description": "Big brother of Arduino Uno for demanding I/O projects.",
     "image": "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400"},
    {"slug": "esp32", "name": "ESP32 DevKit V1", "family": "esp", "mcu": "Xtensa LX6 dual-core",
     "clock": "240 MHz", "flash": "4 MB", "ram": "520 KB", "gpio": 36, "voltage": "3.3V",
     "interfaces": ["Wi-Fi", "Bluetooth", "UART", "I2C", "SPI", "CAN"],
     "languages": ["Arduino C++", "ESP-IDF", "MicroPython", "PlatformIO"],
     "description": "Wi-Fi + Bluetooth SoC for IoT applications.",
     "image": "https://images.unsplash.com/photo-1608564697071-ddf911d81370?w=400"},
    {"slug": "esp8266", "name": "ESP8266 NodeMCU", "family": "esp", "mcu": "Tensilica L106",
     "clock": "80 MHz", "flash": "4 MB", "ram": "80 KB", "gpio": 17, "voltage": "3.3V",
     "interfaces": ["Wi-Fi", "UART", "I2C", "SPI"],
     "languages": ["Arduino C++", "MicroPython", "PlatformIO"],
     "description": "Low-cost Wi-Fi microcontroller.",
     "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400"},
    {"slug": "stm32", "name": "STM32 Blue Pill", "family": "stm32", "mcu": "STM32F103C8T6",
     "clock": "72 MHz", "flash": "64 KB", "ram": "20 KB", "gpio": 37, "voltage": "3.3V",
     "interfaces": ["UART", "I2C", "SPI", "CAN", "USB"],
     "languages": ["Embedded C", "Arduino C++", "PlatformIO"],
     "description": "ARM Cortex-M3 32-bit MCU. Industrial workhorse.",
     "image": "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=400"},
    {"slug": "atmega328p", "name": "ATmega328P (bare)", "family": "atmel", "mcu": "ATmega328P",
     "clock": "20 MHz", "flash": "32 KB", "ram": "2 KB", "gpio": 23, "voltage": "1.8-5.5V",
     "interfaces": ["UART", "I2C", "SPI"], "languages": ["Embedded C", "Arduino C++"],
     "description": "The bare AVR chip powering countless devices.",
     "image": "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=400"},
    {"slug": "rpi-pico", "name": "Raspberry Pi Pico", "family": "rpi", "mcu": "RP2040 dual-core",
     "clock": "133 MHz", "flash": "2 MB", "ram": "264 KB", "gpio": 26, "voltage": "3.3V",
     "interfaces": ["UART", "I2C", "SPI", "PIO"],
     "languages": ["MicroPython", "CircuitPython", "Embedded C", "PlatformIO"],
     "description": "Raspberry Pi Foundation's first microcontroller board.",
     "image": "https://images.unsplash.com/photo-1580983230712-eba75c48b76b?w=400"},
]

SENSORS = [
    {"slug": "dht22", "name": "DHT22 Temp/Humidity", "category": "environment", "protocol": "1-Wire",
     "voltage": "3.3-5V", "description": "Digital temperature + humidity sensor.",
     "typical_use": "Weather stations, HVAC monitoring"},
    {"slug": "bmp280", "name": "BMP280 Barometer", "category": "environment", "protocol": "I2C/SPI",
     "voltage": "1.7-3.6V", "description": "Barometric pressure + temperature.",
     "typical_use": "Altimeters, weather"},
    {"slug": "mpu6050", "name": "MPU6050 IMU", "category": "motion", "protocol": "I2C",
     "voltage": "3-5V", "description": "6-axis gyro + accelerometer.",
     "typical_use": "Drones, robotics, motion tracking"},
    {"slug": "hc-sr04", "name": "HC-SR04 Ultrasonic", "category": "distance", "protocol": "GPIO",
     "voltage": "5V", "description": "Ultrasonic distance sensor (2-400 cm).",
     "typical_use": "Obstacle avoidance, level sensing"},
    {"slug": "pir", "name": "PIR Motion Sensor", "category": "motion", "protocol": "GPIO",
     "voltage": "5V", "description": "Passive infrared motion detector.",
     "typical_use": "Security, presence detection"},
    {"slug": "mq2", "name": "MQ-2 Gas Sensor", "category": "gas", "protocol": "Analog",
     "voltage": "5V", "description": "Detects LPG, propane, methane, smoke.",
     "typical_use": "Gas leak alarms"},
    {"slug": "ds18b20", "name": "DS18B20 Temp Probe", "category": "environment", "protocol": "1-Wire",
     "voltage": "3-5.5V", "description": "Waterproof digital temperature.",
     "typical_use": "Aquariums, industrial monitoring"},
    {"slug": "ldr", "name": "LDR (Photoresistor)", "category": "light", "protocol": "Analog",
     "voltage": "3.3-5V", "description": "Light-dependent resistor.",
     "typical_use": "Ambient light detection"},
]

MODULES = [
    {"slug": "l298n", "name": "L298N Motor Driver", "category": "actuator", "description": "Dual H-bridge DC/stepper motor driver."},
    {"slug": "servo-sg90", "name": "SG90 Micro Servo", "category": "actuator", "description": "9g micro servo motor."},
    {"slug": "relay-5v", "name": "5V Relay Module", "category": "actuator", "description": "Optocoupled relay for AC/DC switching."},
    {"slug": "oled-ssd1306", "name": "SSD1306 OLED 128x64", "category": "display", "description": "0.96\" I2C OLED display."},
    {"slug": "lcd-1602", "name": "LCD 16x2 (HD44780)", "category": "display", "description": "Classic character LCD with I2C backpack."},
    {"slug": "nrf24l01", "name": "nRF24L01+ RF Module", "category": "communication", "description": "2.4 GHz transceiver."},
    {"slug": "lora-sx1278", "name": "LoRa SX1278 433MHz", "category": "communication", "description": "Long-range LoRa transceiver."},
    {"slug": "sd-card", "name": "MicroSD Card Module", "category": "storage", "description": "SPI SD-card breakout."},
]

PROTOCOLS = [
    {"slug": "i2c", "name": "I2C (Inter-Integrated Circuit)", "description": "2-wire synchronous serial bus (SDA/SCL).", "typical_speed": "100 kHz - 3.4 MHz", "pins": "SDA, SCL"},
    {"slug": "spi", "name": "SPI (Serial Peripheral Interface)", "description": "4-wire full-duplex synchronous serial.", "typical_speed": "up to 50+ MHz", "pins": "MOSI, MISO, SCK, CS"},
    {"slug": "uart", "name": "UART (Universal Asynchronous Receiver-Transmitter)", "description": "Asynchronous serial communication.", "typical_speed": "9600 - 115200 baud", "pins": "TX, RX"},
    {"slug": "can", "name": "CAN Bus", "description": "Robust differential bus for automotive/industrial.", "typical_speed": "1 Mbps", "pins": "CAN_H, CAN_L"},
    {"slug": "onewire", "name": "1-Wire", "description": "Single-wire bus for low-speed sensors.", "typical_speed": "16.3 kbps", "pins": "DATA"},
    {"slug": "modbus-rtu", "name": "Modbus RTU", "description": "Industrial serial protocol over RS-485.", "typical_speed": "9600 - 115200 baud", "pins": "A, B (RS-485)"},
]

TEMPLATES = [
    {"slug": "blink-led", "name": "Blink LED", "board": "arduino-uno", "language": "Arduino C++",
     "difficulty": "beginner", "tags": ["gpio", "starter"],
     "description": "Blink an LED at 1Hz on pin 13.",
     "prompt": "Write a simple Blink LED program that toggles pin 13 every 500ms."},
    {"slug": "wifi-scan-esp32", "name": "Wi-Fi Scanner (ESP32)", "board": "esp32", "language": "Arduino C++",
     "difficulty": "beginner", "tags": ["wifi", "iot"],
     "description": "Scan and list nearby Wi-Fi networks.",
     "prompt": "Scan Wi-Fi networks on ESP32 and print SSID, RSSI, and encryption to Serial."},
    {"slug": "mqtt-esp32", "name": "MQTT Publisher (ESP32)", "board": "esp32", "language": "Arduino C++",
     "difficulty": "intermediate", "tags": ["mqtt", "iot", "wifi"],
     "description": "Publish sensor data to an MQTT broker.",
     "prompt": "ESP32 program that connects to Wi-Fi and publishes a DHT22 temperature reading every 10s to MQTT topic 'sensors/temp'."},
    {"slug": "ultrasonic-distance", "name": "Ultrasonic Distance Meter", "board": "arduino-uno", "language": "Arduino C++",
     "difficulty": "beginner", "tags": ["sensor", "hc-sr04"],
     "description": "Measure distance with HC-SR04.",
     "prompt": "Read HC-SR04 ultrasonic sensor, compute distance in cm, print to Serial."},
    {"slug": "servo-sweep", "name": "Servo Sweep", "board": "arduino-uno", "language": "Arduino C++",
     "difficulty": "beginner", "tags": ["actuator", "servo"],
     "description": "Sweep a servo motor 0-180 degrees.",
     "prompt": "Sweep an SG90 servo motor from 0 to 180 degrees and back on pin 9."},
    {"slug": "oled-hello", "name": "OLED Hello World", "board": "esp32", "language": "Arduino C++",
     "difficulty": "beginner", "tags": ["display", "i2c"],
     "description": "Display text on SSD1306 OLED.",
     "prompt": "Show 'Hello HRL' on a 128x64 SSD1306 OLED via I2C from ESP32."},
    {"slug": "line-follower", "name": "Line Follower Robot", "board": "arduino-uno", "language": "Arduino C++",
     "difficulty": "intermediate", "tags": ["robotics", "l298n", "ir-sensor"],
     "description": "Two-IR-sensor line following robot with L298N.",
     "prompt": "Line follower using 2 IR sensors and L298N motor driver on Arduino Uno. Speed 180."},
    {"slug": "micropython-pico-blink", "name": "MicroPython Pico Blink", "board": "rpi-pico", "language": "MicroPython",
     "difficulty": "beginner", "tags": ["micropython", "gpio"],
     "description": "Blink onboard LED with MicroPython.",
     "prompt": "MicroPython script for Raspberry Pi Pico that blinks the onboard LED every 500ms."},
]


async def seed_all():
    db = get_db()
    await _seed("boards", BOARDS, "slug", db)
    await _seed("sensors", SENSORS, "slug", db)
    await _seed("modules", MODULES, "slug", db)
    await _seed("protocols", PROTOCOLS, "slug", db)
    await _seed("templates", TEMPLATES, "slug", db)


async def _seed(collection: str, docs: list, key: str, db):
    coll = db[collection]
    for doc in docs:
        await coll.update_one({key: doc[key]}, {"$setOnInsert": doc}, upsert=True)
