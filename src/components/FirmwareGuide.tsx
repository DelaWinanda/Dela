import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal } from 'lucide-react';

export default function FirmwareGuide() {
  const [copied, setCopied] = useState(false);

  const codeString = `/*
 * IoT Controller: 4 Relay + Sensor DHT11 via Direct IP REST API
 * Mendukung ESP32 dan ESP8266
 * 
 * Update: Web Server Ringan (Port 80) dengan dukungan CORS Handshake
 */

#ifdef ESP32
  #include <WiFi.h>
  #include <WebServer.h>
#else
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
#endif

#include <ArduinoJson.h>
#include <DHT.h>

// ===================== KONFIGURASI WIFI — UBAH DI SINI =====================
const char* ssid     = "Nama_WiFi_Anda";
const char* password = "Password_WiFi_Anda";
// ===========================================================================

// ---------- Pin Relay (Active-LOW: LOW = ON, HIGH = OFF) ----------
const int relayPin[4] = {23, 19, 18, 5}; 
bool relayState[4] = {false, false, false, false};

// ---------- Mode Variasi ----------
int variMode = 0;           // 0 = tidak aktif, 1 = 1->2->3->4, 2 = 4->3->2->1
#define VARI_DELAY 500       // jeda sekuensial antar relay (ms)
unsigned long lastVariStep;
int variIndex = 0;

// ---------- DHT11 -----------
#define DHTPIN  4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ---------- Local HTTP Web Server (Port 80) ----------
#ifdef ESP32
  WebServer server(80);
#else
  ESP8266WebServer server(80);
#endif

// =====================================================================
//  URUSAN RELAY & VARIASI
// =====================================================================

void setRelay(int index, bool on) {
  relayState[index] = on;
  digitalWrite(relayPin[index], on ? LOW : HIGH);
}

void allRelayOff() {
  for (int i = 0; i < 4; i++) setRelay(i, false);
}

void runVariasiStep() {
  if (variMode == 0) return;
  if (millis() - lastVariStep < VARI_DELAY) return;
  lastVariStep = millis();

  // Matikan semua dulu
  for (int i = 0; i < 4; i++) {
    relayState[i] = false;
    digitalWrite(relayPin[i], HIGH);
  }

  int activeRelay;
  if (variMode == 1) {
    activeRelay = variIndex % 4;
  } else {
    activeRelay = 3 - (variIndex % 4);
  }

  setRelay(activeRelay, true);
  variIndex++;
}

// =====================================================================
//  LOCAL HTTP SERVER HANDLERS (Direct IP Mode)
// =====================================================================

void handleCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Max-Age", "10000");
  server.sendHeader("Access-Control-Allow-Methods", "PUT,POST,GET,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
}

void handleRoot() {
  handleCORS();
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  StaticJsonDocument<256> doc;
  doc["device"] = "ESP-Relay-Sensor";
  doc["temperature"] = isnan(temperature) ? 0 : temperature;
  doc["humidity"] = isnan(humidity) ? 0 : humidity;
  
  JsonArray relays = doc.createNestedArray("relays");
  for (int i = 0; i < 4; i++) {
    relays.add(relayState[i]);
  }
  doc["variMode"] = variMode;

  String jsonStr;
  serializeJson(doc, jsonStr);
  server.send(200, "application/json", jsonStr);
}

// Handler Direct HTTP relay
void handleRelaySet() {
  handleCORS();
  if (server.hasArg("id") && server.hasArg("state")) {
    int id = server.arg("id").toInt();
    bool state = server.arg("state") == "1";
    
    if (id >= 0 && id < 4) {
      variMode = 0;
      setRelay(id, state);
      server.send(200, "text/plain", "OK. Relay " + String(id+1) + " set to " + String(state));
      return;
    }
  }
  server.send(400, "text/plain", "Bad Request");
}

void handleVariasi() {
  handleCORS();
  if (server.hasArg("mode")) {
    variMode = server.arg("mode").toInt();
    variIndex = 0;
    if (variMode == 0) allRelayOff();
    server.send(200, "text/plain", "OK. Variasi Mode Set: " + String(variMode));
  } else {
    server.send(400, "text/plain", "Bad Request");
  }
}

// =====================================================================
//  SETUP & BOOTING
// =====================================================================
void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 4; i++) {
    pinMode(relayPin[i], OUTPUT);
    digitalWrite(relayPin[i], HIGH);
  }

  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\\n✅ WiFi terhubung!");
  Serial.print("🌐 IP Local ESP: ");
  Serial.println(WiFi.localIP());

  // Setup Local HTTP Server Routers
  server.on("/", handleRoot);
  server.on("/toggle", handleRelaySet);
  server.on("/variasi", handleVariasi);
  server.begin();
  Serial.println("🌐 Server Direct IP Aktif di Port 80!");
}

// =====================================================================
//  LOOP UTAMA
// =====================================================================
void loop() {
  server.handleClient(); // Handle server Direct IP
  runVariasiStep();      // Jalankan sekuens variasi
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#F0EFEC] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full text-[#141414]">
      {/* Header section */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-[#141414]/15">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#141414] text-white">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-display">Panduan Firmware Direct IP (Arduino Sketch)</h2>
            <p className="text-[10px] font-mono text-[#141414]/60">Kode Web Server Port 80 + CORS Handshake</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-3 py-1.5 border-2 border-[#141414] bg-white hover:bg-[#F0EFEC] text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-transform active:translate-y-0.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Disalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Kode</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-[#141414]/80 mb-4 leading-relaxed font-sans">
        Gunakan sketch minimalis di bawah untuk menjalankan Web Server local langsung di port 80 ESP32/ESP8266 Anda. Program ini telah diprogram dengan <strong className="font-bold">CORS Handshake Headers</strong> agar browser dari localhost maupun cloud diizinkan mengakses resource secara asinkron.
      </p>

      {/* Embedded Code block */}
      <div className="flex-1 bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-4 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[350px] custom-scrollbar select-text shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)]">
        <div className="flex items-center justify-between border-b border-[#E4E3E0]/15 pb-2 mb-2 text-white/50">
          <span className="flex items-center space-x-1.5 font-bold text-[9px]">
            <Terminal className="w-3.5 h-3.5" />
            <span>ESP_DIRECT_IP_CORS.INO</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold">C++ (Arduino IDE)</span>
        </div>
        <pre className="whitespace-pre font-mono leading-relaxed">{codeString}</pre>
      </div>

      {/* Instruction Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t-2 border-[#141414]/15 text-[10px]">
        <div className="bg-white p-3 border-2 border-[#141414] shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
          <span className="font-bold uppercase tracking-wider block mb-1 font-display">1. Library:</span>
          Pastikan Anda menginstal Library <strong className="font-bold">DHT sensor library</strong> (oleh Adafruit) dan <strong className="font-bold">ArduinoJson</strong>.
        </div>
        <div className="bg-white p-3 border-2 border-[#141414] shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
          <span className="font-bold uppercase tracking-wider block mb-1 font-display">2. Sesuaikan WiFi:</span>
          Tulis SSID dan Password WiFi lokal Anda pada konstanta WiFi di bagian atas program.
        </div>
        <div className="bg-white p-3 border-2 border-[#141414] shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
          <span className="font-bold uppercase tracking-wider block mb-1 font-display">3. Masukkan IP:</span>
          Salin alamat IP local dari Serial Monitor ke input konfigurasi di panel samping kanan!
        </div>
      </div>
    </div>
  );
}
