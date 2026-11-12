# HumidiSense — Setup Guide

Rain & Humidity Monitoring System (ESP32 + Supabase + React website).

## 1. Supabase (do this first)

1. Open your project at https://supabase.com → **SQL Editor** → **New query**.
2. Paste everything in `supabase/schema.sql` and click **Run**.

It sets up:
- `sensor_readings`: the ESP32 can insert and the dashboard can read.
- `admin_accounts`: passwords are hashed, and the table can't be read from the browser.
- `admin_login()`: the function the Sign In page uses.

**Admin login:**
- If you already had an `admin` row, its password stays the same.
- Otherwise the script creates `admin` / `admin123`.
- To change a password, run the snippet at the bottom of `schema.sql`.

## 2. Website

```
npm install
npm run dev        # http://localhost:5173
```

`.env` (optional; the same values are already in `src/lib/supabase.ts`):

```
VITE_SUPABASE_URL=https://wkcofzeivrmarwhskvjr.supabase.co
VITE_SUPABASE_ANON_KEY=...your anon key...
```

Restart `npm run dev` after editing `.env`.

### Pages
| URL | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/developers` | Members |
| `/signin` | Admin sign in |
| `/admin` | Dashboard (live, refreshes every 5 s) |
| `/admin/readings` | Full history, filters, CSV export |

### Deploy (Netlify)
- Delete the old `dist` folder first, then run `npm run build`.
- Upload `dist/`. `public/_redirects` already makes page refreshes work.
- If you used `.env`, add the same two variables in Netlify → Site settings → Environment variables.

## 3. ESP32

Open `firmware/humidisense_esp32/humidisense_esp32.ino` in Arduino IDE.

Libraries: **WiFiManager** (tzapu), **DHT sensor library** (Adafruit) + **Adafruit Unified Sensor**, **ESPSupabase** (jhagas).

| Part | ESP32 pin |
|---|---|
| Rain sensor VCC | GPIO 5 |
| Rain sensor AO | **GPIO 34** |
| Rain sensor GND | GND |
| DHT11 DATA | GPIO 18 |
| DHT11 VCC / GND | 3.3V / GND |

The rain sensor uses GPIO 34 because GPIO 4 is an ADC2 pin, and ADC2 doesn't work while Wi-Fi is on (classic ESP32).

**First boot:**
1. Connect to the Wi-Fi hotspot **ESP32_Rain_Monitor**.
2. Open `192.168.4.1` and pick your Wi-Fi.

**Calibration:** open Serial Monitor (115200) and note the `Rain raw:` value with the sensor dry and fully wet. Put those numbers in `DRY_VALUE` and `WET_VALUE`.

## Rain levels
| Rain % | Status |
|---|---|
| 0–10 | No Rain |
| 11–40 | Light Rain |
| 41–70 | Moderate Rain |
| 71–100 | Heavy Rain |

The thresholds are in `src/lib/types.ts` → `rainStatus()`.

## Troubleshooting
- **"Database is not set up yet"** on sign in: run `supabase/schema.sql`.
- **Device shows Offline:** no reading arrived in the last 60 s. Check the ESP32 Serial Monitor.
- **ESP32 says "Insert failed. HTTP 401/403":** run `supabase/schema.sql`. The ESP32 inserts with the anon key, and the script allows that.
