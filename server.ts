import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory states for IoT Device
let relayStates = [false, false, false, false];
let variMode = 0; // 0 = nonaktif, 1 = 1->2->3->4, 2 = 4->3->2->1
let variIndex = 0;
let lastVariStep = Date.now();
const VARI_DELAY = 1000; // interval in ms for simulation variable mode

// Circular buffer for DHT11 readings
interface SensorReading {
  temperature: number;
  humidity: number;
  heatIndex: number;
  timestamp: string;
}

let sensorHistory: SensorReading[] = [];
const MAX_HISTORY_LEN = 50;

// Initialize history with beautiful mock records so charts look stunning on boot
const now = new Date();
for (let i = 24; i >= 0; i--) {
  const time = new Date(now.getTime() - i * 60000); // 1 minute intervals
  // Generate random base temperature between 26°C and 29°C
  const baseTemp = 27.5 + Math.sin(i / 3) * 1.2 + Math.random() * 0.3;
  // Generate humidity between 55% and 65%
  const baseHumi = 60.0 + Math.cos(i / 4) * 4.0 + Math.random() * 0.5;
  
  // Custom heat index calculation (simplified Adafruit formula)
  const hi = baseTemp + 0.5 * (baseTemp + 61.0 + ((baseTemp - 68.0) * 1.2) + (baseHumi * 0.094));

  sensorHistory.push({
    temperature: parseFloat(baseTemp.toFixed(1)),
    humidity: parseFloat(baseHumi.toFixed(1)),
    heatIndex: parseFloat(hi.toFixed(1)),
    timestamp: time.toLocaleTimeString('id-ID', { hour12: false }),
  });
}

// Simulated automated step for variety modes
function processVariModeSimulation() {
  if (variMode === 0) return;
  const nowMs = Date.now();
  if (nowMs - lastVariStep < VARI_DELAY) return;
  lastVariStep = nowMs;

  // Turn all off
  relayStates = [false, false, false, false];
  
  let activeRelay = 0;
  if (variMode === 1) {
    activeRelay = variIndex % 4; // 1->2->3->4
  } else if (variMode === 2) {
    activeRelay = 3 - (variIndex % 4); // 4->3->2->1
  }

  relayStates[activeRelay] = true;
  variIndex++;
}

// Query states
setInterval(() => {
  processVariModeSimulation();
}, 200);

// ==========================================
//  REST API ENDPOINTS
// ==========================================

// 1. Get current states & history
app.get('/api/status', (req, res) => {
  res.json({
    relays: relayStates,
    variMode,
    latestSensor: sensorHistory[sensorHistory.length - 1] || null,
    history: sensorHistory,
  });
});

// 2. Control single relay
app.post('/api/relay', (req, res) => {
  const { id, state } = req.body;
  if (typeof id === 'number' && id >= 0 && id < 4) {
    variMode = 0; // Turn off variety mode when controlling manual relays
    relayStates[id] = !!state;
    res.json({ success: true, relays: relayStates, variMode });
  } else {
    res.status(400).json({ success: false, error: 'Invalid relay id' });
  }
});

// 3. Control all relays
app.post('/api/relay/all', (req, res) => {
  const { state } = req.body;
  variMode = 0;
  relayStates = [!!state, !!state, !!state, !!state];
  res.json({ success: true, relays: relayStates, variMode });
});

// 4. Control variable mode
app.post('/api/relay/variMode', (req, res) => {
  const { mode } = req.body;
  if (typeof mode === 'number' && mode >= 0 && mode <= 2) {
    variMode = mode;
    variIndex = 0;
    lastVariStep = Date.now();
    if (variMode === 0) {
      relayStates = [false, false, false, false];
    }
    res.json({ success: true, relays: relayStates, variMode });
  } else {
    res.status(400).json({ success: false, error: 'Invalid mode value' });
  }
});

// 5. ESP32 sends/pushes live DHT11 sensor data to Express Server
app.post('/api/sensor-data', (req, res) => {
  const { temperature, humidity, heatIndex, isRealESP } = req.body;
  
  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    return res.status(400).json({ success: false, error: 'Invalid temperature or humidity' });
  }

  const hi = typeof heatIndex === 'number' ? heatIndex : 
    (temperature + 0.5 * (temperature + 61.0 + ((temperature - 68.0) * 1.2) + (humidity * 0.094)));

  const reading: SensorReading = {
    temperature: parseFloat(temperature.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    heatIndex: parseFloat(hi.toFixed(1)),
    timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false }),
  };

  sensorHistory.push(reading);
  if (sensorHistory.length > MAX_HISTORY_LEN) {
    sensorHistory.shift();
  }

  res.json({ success: true, received: reading });
});

// 6. ESP32 polls this endpoint to fetch relay commands
app.get('/api/relay-commands', (req, res) => {
  res.json({
    relays: relayStates,
    variMode,
  });
});

// 7. Proxy a web request directly to the local ESP32 (resolves browser CORS/HTTPS block)
app.post('/api/proxy/direct', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'Missing destination URL' });
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(id);

    const txt = await response.text();
    res.json({ success: true, data: txt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Connection failed' });
  }
});

// 8. Proxy Telegram command messages to avoid browser CORS/Mixed Content limitations
app.post('/api/telegram/send', async (req, res) => {
  const { token, chatId, message } = req.body;
  if (!token || !chatId || !message) {
    return res.status(400).json({ success: false, error: 'Token, ChatID, and Message are required' });
  }

  const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      res.json({ success: true, result: data.result });
    } else {
      res.status(400).json({ success: false, error: data.description || 'Telegram API returned error' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Telegram server communication failed' });
  }
});

// ==========================================
//  INTEGRATE VITE MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server starting on http://localhost:${PORT}`);
  });
}

startServer();
