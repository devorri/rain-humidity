// =====================================================================
// HumidiSense — ESP32 Rain & Humidity Monitor
// Sends rain (%), temperature (°C) and humidity (%) to Supabase every 5 s.
//
// Libraries (Arduino Library Manager):
//   - WiFiManager (tzapu)
//   - DHT sensor library (Adafruit) + Adafruit Unified Sensor
//   - ESPSupabase (jhagas)
//
// WIRING (classic ESP32 DevKit):
//   Rain sensor VCC -> GPIO 5   (powered only while reading, slows corrosion)
//   Rain sensor GND -> GND
//   Rain sensor AO  -> GPIO 34  (ADC1 pin — ADC2 pins like GPIO 4 do NOT work while Wi-Fi is on)
//   DHT11 DATA      -> GPIO 18  (VCC -> 3.3V, GND -> GND)
// If you use an ESP32-S3, GPIO 4 is fine; change RAIN_ANALOG_PIN back to 4.
// =====================================================================

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ESPSupabase.h>

// --- Supabase Credentials (same project as the website) ---
const char* supabaseUrl = "https://wkcofzeivrmarwhskvjr.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrY29memVpdnJtYXJ3aHNrdmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NjAwNzgsImV4cCI6MjExMDAzNjA3OH0.CjAVTfwizremCRPVnjZ2wa6CvPcHOV27JkOVzoPM070";

String tableName = "sensor_readings";

// --- Pin Definitions ---
const int RAIN_POWER_PIN = 5;
const int RAIN_ANALOG_PIN = 34;   // ADC1 (was 4 = ADC2, unreliable with Wi-Fi)
const int DHT_PIN = 18;

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);
Supabase supabase;

// --- Calibration Constants for Rain Sensor ---
// Open Serial Monitor, note the raw value when DRY and when fully WET, then set these.
const int DRY_VALUE = 4095;
const int WET_VALUE = 1000;

const unsigned long UPLOAD_INTERVAL_MS = 5000;
unsigned long lastUpload = 0;

int readRainPercent() {
  digitalWrite(RAIN_POWER_PIN, HIGH);
  delay(50);

  // average a few samples for a steadier value
  long total = 0;
  for (int i = 0; i < 8; i++) {
    total += analogRead(RAIN_ANALOG_PIN);
    delay(2);
  }
  digitalWrite(RAIN_POWER_PIN, LOW);

  int raw = total / 8;
  int percent = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
  percent = constrain(percent, 0, 100);

  Serial.print("Rain raw: ");
  Serial.print(raw);
  Serial.print("  -> ");
  Serial.print(percent);
  Serial.println("%");
  return percent;
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("Wi-Fi lost. Reconnecting...");
  WiFi.reconnect();
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(250);
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Wi-Fi reconnected.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(RAIN_POWER_PIN, OUTPUT);
  digitalWrite(RAIN_POWER_PIN, LOW);
  analogReadResolution(12);                       // 0–4095
  analogSetPinAttenuation(RAIN_ANALOG_PIN, ADC_11db);  // full 0–3.3V range

  dht.begin();

  // --- WiFiManager Setup ---
  WiFiManager wm;
  // wm.resetSettings();   // uncomment once to clear saved Wi-Fi
  wm.setConfigPortalTimeout(180);

  Serial.println("Starting WiFiManager portal...");
  // Uses saved Wi-Fi, or opens hotspot "ESP32_Rain_Monitor" (go to 192.168.4.1)
  bool res = wm.autoConnect("ESP32_Rain_Monitor");

  if (!res) {
    Serial.println("Failed to connect or configuration timed out. Rebooting...");
    delay(3000);
    ESP.restart();
  }

  Serial.println("\nConnected to Wi-Fi successfully!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  supabase.begin(supabaseUrl, supabaseKey);
}

void loop() {
  if (millis() - lastUpload < UPLOAD_INTERVAL_MS && lastUpload != 0) return;
  lastUpload = millis();

  ensureWiFi();

  // 1. Rain sensor (%)
  int rainPercent = readRainPercent();

  // 2. DHT11 temperature & humidity
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor! Skipping upload.");
    return;
  }

  // 3. JSON matching the table columns
  String jsonData = "{";
  jsonData += "\"rain_percent\":" + String(rainPercent) + ",";
  jsonData += "\"temperature\":" + String(temperature, 2) + ",";
  jsonData += "\"humidity\":" + String(humidity, 2);
  jsonData += "}";

  Serial.println("Sending: " + jsonData);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("No Wi-Fi. Will retry next cycle.");
    return;
  }

  int responseCode = supabase.insert(tableName, jsonData, false);

  if (responseCode >= 200 && responseCode < 300) {
    Serial.print("Success! HTTP ");
    Serial.println(responseCode);
  } else {
    Serial.print("Insert failed. HTTP ");
    Serial.println(responseCode);
    if (responseCode == 401 || responseCode == 403) {
      Serial.println("-> Permission denied. Run supabase/schema.sql in the Supabase SQL Editor.");
    }
  }
}
