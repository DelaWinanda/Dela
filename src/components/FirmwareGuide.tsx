import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal } from 'lucide-react';

export default function FirmwareGuide() {
  const [copied, setCopied] = useState(false);

  const codeString = `/*
 * IoT Controller: 4 Relay + Sensor DHT11 via Direct IP REST API & Telegram Bot
 * Mendukung ESP32 dan ESP8266
 * 
 * Library yang dibutuhkan (install via Library Manager):
 *  - UniversalTelegramBot by Brian Lough
 *  - ArduinoJson
 *  - DHT sensor library by Adafruit
 *  - Adafruit Unified Sensor
 */

#ifdef ESP32
  #include <WiFi.h>
  #include <WebServer.h>
#else
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
#endif

#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ===================== KONFIGURASI — UBAH DI SINI =====================
const char* ssid     = "Kocakk";
const char* password = "11223344";

#define BOTtoken  "8611614379:AAESo7Y4Fh1_V27YYqh-yCfLT19sB8ztkkI"
#define CHAT_ID   "1300283513"
// ======================================================================

// ---------- Pin Relay (active-LOW: LOW = ON, HIGH = OFF) ----------
const int relayPin[4] = {23, 19, 18, 5};

// Nama relay (tampil di pesan Telegram)
const String relayName[4] = {"Relay 1", "Relay 2", "Relay 3", "Relay 4"};

// Status relay (true = ON)
bool relayState[4] = {false, false, false, false};

// ---------- Mode Variasi ----------
int variMode = 0;           // 0 = tidak aktif, 1 = maju, 2 = mundur
#define VARI_DELAY 50       // jeda sekuensial antar relay (ms)
unsigned long lastVariStep;
int variIndex = 0;

// ---------- DHT11 -----------
#define DHTPIN  4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ---------- Telegram ----------
#ifdef ESP8266
  X509List cert(TELEGRAM_CERTIFICATE_ROOT);
#endif

WiFiClientSecure client;
UniversalTelegramBot bot(BOTtoken, client);

int botRequestDelay = 1000;
unsigned long lastTimeBotRan;

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
//  TELEGRAM MESSAGE SENDS
// =====================================================================

void sendDHTData(String chat_id) {
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    bot.sendMessage(chat_id, "⚠️ Gagal membaca sensor DHT11. Periksa koneksi sensor.", "");
    return;
  }

  float heatIndex = dht.computeHeatIndex(temperature, humidity, false);

  String msg = "🌡️ *Data Sensor DHT11*\n";
  msg += "──────────────────\n";
  msg += "🌡 Suhu      : *" + String(temperature, 1) + " °C*\n";
  msg += "💧 Kelembapan: *" + String(humidity, 1) + " %*\n";
  msg += "🔥 Heat Index: *" + String(heatIndex, 1) + " °C*\n";

  bot.sendMessage(chat_id, msg, "Markdown");
}

void sendRelayStatus(String chat_id) {
  String msg = "🔌 *Status Relay*\n";
  msg += "──────────────────\n";
  for (int i = 0; i < 4; i++) {
    msg += (relayState[i] ? "🟢" : "🔴");
    msg += " " + relayName[i] + ": *" + (relayState[i] ? "ON" : "OFF") + "*\n";
  }
  bot.sendMessage(chat_id, msg, "Markdown");
}

void sendWelcome(String chat_id, String from_name) {
  String msg = "👋 Halo, *" + from_name + "*!\n\n";
  msg += "📋 *Daftar Perintah:*\n";
  msg += "──────────────────\n";
  msg += "🔌 *Kontrol Relay:*\n";
  msg += "/relay1\\_on  — Nyalakan Relay 1\n";
  msg += "/relay1\\_off — Matikan Relay 1\n";
  msg += "/relay2\\_on  — Nyalakan Relay 2\n";
  msg += "/relay2\\_off — Matikan Relay 2\n";
  msg += "/relay3\\_on  — Nyalakan Relay 3\n";
  msg += "/relay3\\_off — Matikan Relay 3\n";
  msg += "/relay4\\_on  — Nyalakan Relay 4\n";
  msg += "/relay4\\_off — Matikan Relay 4\n";
  msg += "/all\\_on     — Nyalakan semua relay\n";
  msg += "/all\\_off    — Matikan semua relay\n\n";
  msg += "✨ *Mode Variasi:*\n";
  msg += "/vari1      — Nyala bergantian 1→2→3→4\n";
  msg += "/vari2      — Nyala bergantian 4→3→2→1\n";
  msg += "/vari\\_stop — Hentikan mode variasi\n\n";
  msg += "📊 *Sensor & Status:*\n";
  msg += "/dht        — Baca suhu & kelembapan\n";
  msg += "/status     — Status semua relay\n";
  bot.sendMessage(chat_id, msg, "Markdown");
}

// =====================================================================
//  HANDLER PESAN MASUK TELEGRAM
// =====================================================================
void handleNewMessages(int numNewMessages) {
  for (int i = 0; i < numNewMessages; i++) {

    String chat_id   = String(bot.messages[i].chat_id);
    String from_name = bot.messages[i].from_name;
    String text      = bot.messages[i].text;

    if (chat_id != CHAT_ID) {
      bot.sendMessage(chat_id, "⛔ Unauthorized user.", "");
      continue;
    }

    Serial.println("Pesan Telegram: " + text);

    if (text == "/start") {
      sendWelcome(chat_id, from_name);
    }

    else if (text == "/relay1_on")  { variMode = 0; setRelay(0, true);  bot.sendMessage(chat_id, "✅ " + relayName[0] + " *ON*", "Markdown"); }
    else if (text == "/relay1_off") { variMode = 0; setRelay(0, false); bot.sendMessage(chat_id, "❌ " + relayName[0] + " *OFF*", "Markdown"); }

    else if (text == "/relay2_on")  { variMode = 0; setRelay(1, true);  bot.sendMessage(chat_id, "✅ " + relayName[1] + " *ON*", "Markdown"); }
    else if (text == "/relay2_off") { variMode = 0; setRelay(1, false); bot.sendMessage(chat_id, "❌ " + relayName[1] + " *OFF*", "Markdown"); }

    else if (text == "/relay3_on")  { variMode = 0; setRelay(2, true);  bot.sendMessage(chat_id, "✅ " + relayName[2] + " *ON*", "Markdown"); }
    else if (text == "/relay3_off") { variMode = 0; setRelay(2, false); bot.sendMessage(chat_id, "❌ " + relayName[2] + " *OFF*", "Markdown"); }

    else if (text == "/relay4_on")  { variMode = 0; setRelay(3, true);  bot.sendMessage(chat_id, "✅ " + relayName[3] + " *ON*", "Markdown"); }
    else if (text == "/relay4_off") { variMode = 0; setRelay(3, false); bot.sendMessage(chat_id, "❌ " + relayName[3] + " *OFF*", "Markdown"); }

    else if (text == "/all_on") {
      variMode = 0;
      for (int r = 0; r < 4; r++) setRelay(r, true);
      bot.sendMessage(chat_id, "✅ *Semua relay ON*", "Markdown");
    }
    else if (text == "/all_off") {
      variMode = 0;
      for (int r = 0; r < 4; r++) setRelay(r, false);
      bot.sendMessage(chat_id, "❌ *Semua relay OFF*", "Markdown");
    }

    else if (text == "/vari1") {
      allRelayOff();
      variMode  = 1;
      variIndex = 0;
      lastVariStep = millis();
      bot.sendMessage(chat_id, "✨ *Variasi 1 aktif:* 1 → 2 → 3 → 4\nKetik /vari\\_stop untuk menghentikan.", "Markdown");
    }
    else if (text == "/vari2") {
      allRelayOff();
      variMode  = 2;
      variIndex = 0;
      lastVariStep = millis();
      bot.sendMessage(chat_id, "✨ *Variasi 2 aktif:* 4 → 3 → 2 → 1\nKetik /vari\\_stop untuk menghentikan.", "Markdown");
    }
    else if (text == "/vari_stop") {
      variMode = 0;
      allRelayOff();
      bot.sendMessage(chat_id, "⏹ *Mode variasi dihentikan.* Semua relay OFF.", "Markdown");
    }

    else if (text == "/dht") {
      sendDHTData(chat_id);
    }

    else if (text == "/status") {
      sendRelayStatus(chat_id);
    }

    else {
      bot.sendMessage(chat_id, "❓ Perintah tidak dikenal. Ketik /start untuk melihat daftar perintah.", "");
    }
  }
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

#ifdef ESP8266
  configTime(0, 0, "pool.ntp.org");
  client.setTrustAnchors(&cert);
#endif

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

#ifdef ESP32
  client.setCACert(TELEGRAM_CERTIFICATE_ROOT);
#endif

  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✅ WiFi terhubung!");
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

  // Jalankan asinkron polling telegram
  if (millis() > lastTimeBotRan + botRequestDelay) {
    int numNewMessages = bot.getUpdates(bot.last_message_received + 1);

    while (numNewMessages) {
      Serial.println("📨 Pesan baru Telegram: " + String(numNewMessages));
      handleNewMessages(numNewMessages);
      numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    }

    lastTimeBotRan = millis();
  }
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
