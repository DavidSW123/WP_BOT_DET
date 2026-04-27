#!/bin/bash
# ==============================================
# INSTALADOR AUTOMÁTICO - WhatsApp Bot
# Investigalo Detectives
# ==============================================
# Uso: curl o copiar/pegar en el servidor y ejecutar

set -e

echo "=========================================="
echo " Instalando WhatsApp Bot - Investigalo"
echo "=========================================="

# 1. Instalar Node.js 20
echo "[1/6] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
sudo apt-get install -y nodejs > /dev/null 2>&1
echo "✅ Node.js $(node -v) instalado"

# 2. Crear directorio
echo "[2/6] Creando proyecto..."
sudo mkdir -p /opt/whatsapp-bot/src
cd /opt/whatsapp-bot

# 3. Crear package.json
cat > package.json << 'PKGJSON'
{
  "name": "whatsapp-bot-investigalo",
  "version": "1.0.0",
  "description": "Bot WhatsApp IA para Investigalo Detectives",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "express": "^4.21.0",
    "axios": "^1.7.0",
    "dotenv": "^16.4.0"
  }
}
PKGJSON

# 4. Crear todos los archivos del bot

cat > src/whatsapp.js << 'EOF'
const axios = require('axios');
const WHATSAPP_API = 'https://graph.facebook.com/v22.0';

async function sendMessage(to, text) {
  const url = `${WHATSAPP_API}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  try {
    await axios.post(url, {
      messaging_product: 'whatsapp', to, type: 'text', text: { body: text }
    }, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }
    });
    console.log(`[WhatsApp] Mensaje enviado a ${to}`);
  } catch (err) {
    console.error('[WhatsApp] Error enviando:', err.response?.data || err.message);
  }
}

async function markAsRead(messageId) {
  const url = `${WHATSAPP_API}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  try {
    await axios.post(url, {
      messaging_product: 'whatsapp', status: 'read', message_id: messageId
    }, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }
    });
  } catch (err) {}
}

function extractMessage(body) {
  try {
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (value?.statuses) return null;
    const message = value?.messages?.[0];
    if (!message) return null;
    return {
      from: message.from, messageId: message.id, timestamp: message.timestamp,
      type: message.type, text: message.type === 'text' ? message.text.body : null,
      name: value.contacts?.[0]?.profile?.name || 'Cliente'
    };
  } catch { return null; }
}

module.exports = { sendMessage, markAsRead, extractMessage };
EOF

cat > src/prompt.js << 'EOF'
const BASE_PROMPT = `Eres el asistente virtual de Investigalo Detectives, una agencia de detectives privados con sede en Barcelona y cobertura en toda España. Hablas en nombre de la agencia.

IDENTIDAD:
- Nombre: Investigalo Detectives
- Sede: Barcelona. Cobertura: toda España
- Licencia oficial del Ministerio del Interior
- Web: www.investigalo-detectives.com

TONO:
- Amable, cercano pero profesional. Transmites confianza y discreción absoluta
- Nunca suenas robótico ni usas menús. Conversas de forma natural
- Usas "usted" por defecto, si el cliente tutea, puedes tutear
- Nunca reveles que eres un bot o IA. Eres un miembro del equipo de atención

SERVICIOS:
1. Infidelidades y sospechas de engaño
2. Bajas fingidas (fraude laboral)
3. Localización de personas y bienes
4. Vigilancias y seguimientos
5. Vigilancia no uniformada (eventos, hoteles, ferias)
6. Contraespionaje industrial
7. Competencia desleal
8. Contra-vigilancias
9. Orden de alejamiento (verificación cumplimiento)

TARIFAS:
- Por horas (mínimo 4h) + gastos. Paquetes de horas o tarifa plana por jornada
- Presupuesto personalizado. Consulta inicial gratuita de 15 min
- NUNCA des precios concretos

REGLAS:
- SIEMPRE responde en formato estructurado (ver abajo)
- Recoge información del caso: qué necesita, contexto, urgencia
- Fuera de servicios → redirige amablemente
- Precios → presupuesto personalizado tras consulta gratuita
- Nunca prometas resultados. Todo dentro del marco legal

URGENTE (llamar al detective):
- Incumplimiento orden de alejamiento
- Amenazas activas o riesgo de agresión inminente
- Persona desaparecida recientemente
- Riesgo inmediato para seguridad física

NO URGENTE (aunque el cliente insista):
- Infidelidades, bajas fingidas, localización deudores/bienes
- Investigaciones empresariales, cualquier caso sin riesgo físico

FORMATO OBLIGATORIO:
[URGENCIA:SI] o [URGENCIA:NO]
[RESUMEN:descripción en 10 palabras máximo]
[RESPUESTA]
(respuesta natural al cliente)`;

const OFFICE_HOURS = `
HORARIO: OFICINA (8:00-20:00). Puedes ofrecer consulta gratuita de 15 min. Un detective puede atenderle hoy. Recoge info del caso.`;

const OFF_HOURS = `
HORARIO: FUERA (20:00-8:00). Prioridad: informar que atención personalizada es de 8:00 a 20:00.
- NO urgente: explica que necesitáis verificaciones legales con organismos cerrados, os pondréis en contacto mañana. Sé cálido.
- Ejemplo: "Entiendo su situación. Para ayudarle necesitamos realizar verificaciones legales con organismos que están cerrados. Mañana a partir de las 8:00 nos pondremos en contacto conforme realicemos dichas verificaciones. Su caso será atendido con total prioridad y discreción."
- SÍ urgente: máxima seriedad, recoge info, indica que se contacta al detective de guardia.`;

function getSystemPrompt(isOffHours) {
  return BASE_PROMPT + (isOffHours ? OFF_HOURS : OFFICE_HOURS);
}
module.exports = { getSystemPrompt };
EOF

cat > src/gemini.js << 'EOF'
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSystemPrompt } = require('./prompt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const conversations = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, conv] of conversations) {
    if (now - conv.lastActivity > 24 * 60 * 60 * 1000) conversations.delete(key);
  }
}, 60 * 60 * 1000);

function getConversation(phone) {
  if (!conversations.has(phone)) conversations.set(phone, { history: [], lastActivity: Date.now() });
  const conv = conversations.get(phone);
  conv.lastActivity = Date.now();
  return conv;
}

async function chat(phone, name, text, isOffHours) {
  const conv = getConversation(phone);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: getSystemPrompt(isOffHours) });
  conv.history.push({ role: 'user', parts: [{ text }] });
  const recent = conv.history.slice(-20);

  try {
    const session = model.startChat({ history: recent.slice(0, -1) });
    const result = await session.sendMessage(text);
    const raw = result.response.text();
    const parsed = parseResponse(raw);
    conv.history.push({ role: 'model', parts: [{ text: raw }] });
    return parsed;
  } catch (err) {
    console.error('[Gemini] Error:', err.message);
    return { reply: 'Disculpe, estamos teniendo dificultades técnicas. Inténtelo de nuevo en unos minutos o llámenos en horario de oficina (8:00-20:00).', isUrgent: false, summary: 'Error técnico' };
  }
}

function parseResponse(raw) {
  let isUrgent = false, summary = '', reply = raw;
  const urgMatch = raw.match(/\[URGENCIA:(SI|NO)\]/i);
  if (urgMatch) isUrgent = urgMatch[1].toUpperCase() === 'SI';
  const sumMatch = raw.match(/\[RESUMEN:(.+?)\]/i);
  if (sumMatch) summary = sumMatch[1].trim();
  const respMatch = raw.split(/\[RESPUESTA\]\n?/i);
  if (respMatch.length > 1) { reply = respMatch[1].trim(); }
  else { reply = raw.replace(/\[URGENCIA:(SI|NO)\]\n?/gi, '').replace(/\[RESUMEN:.+?\]\n?/gi, '').replace(/\[RESPUESTA\]\n?/gi, '').trim(); }
  return { reply, isUrgent, summary };
}

module.exports = { chat };
EOF

cat > src/schedule.js << 'EOF'
function isOffHours() {
  const hour = parseInt(new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: 'numeric', hour12: false }).format(new Date()), 10);
  return hour >= 20 || hour < 8;
}
function isOutOfService() { return isOffHours(); }
module.exports = { isOffHours, isOutOfService };
EOF

cat > src/ntfy.js << 'EOF'
const axios = require('axios');

async function sendUrgentAlert({ clientPhone, clientName, summary, messageText }) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const body = `Cliente: ${clientName}\nTeléfono: ${clientPhone}\nHora: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}\n\nMensaje:\n${messageText.substring(0, 500)}`;
  try {
    await axios.post(`https://ntfy.sh/${topic}`, body, {
      headers: { 'Title': `⚠️ URGENCIA - ${summary}`, 'Priority': '5', 'Tags': 'rotating_light,warning', 'Actions': `view, Llamar al cliente, tel:${clientPhone}` }
    });
    console.log(`[ntfy] Alerta urgente: ${summary}`);
  } catch (err) { console.error('[ntfy] Error:', err.message); }
}

async function sendInfoNotification({ clientPhone, clientName, summary }) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const body = `Cliente: ${clientName}\nTeléfono: ${clientPhone}\nHora: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}\nResumen: ${summary}`;
  try {
    await axios.post(`https://ntfy.sh/${topic}`, body, {
      headers: { 'Title': `📋 Nuevo caso - ${summary}`, 'Priority': '3', 'Tags': 'memo' }
    });
  } catch (err) { console.error('[ntfy] Error:', err.message); }
}

module.exports = { sendUrgentAlert, sendInfoNotification };
EOF

cat > src/index.js << 'EOF'
require('dotenv').config();
const express = require('express');
const { sendMessage, markAsRead, extractMessage } = require('./whatsapp');
const { chat } = require('./gemini');
const { isOutOfService } = require('./schedule');
const { sendUrgentAlert, sendInfoNotification } = require('./ntfy');

const app = express();
app.use(express.json());
const processed = new Set();
setInterval(() => processed.clear(), 3600000);

app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const msg = extractMessage(req.body);
    if (!msg || processed.has(msg.messageId)) return;
    processed.add(msg.messageId);
    if (msg.type !== 'text' || !msg.text) { await sendMessage(msg.from, 'Disculpe, de momento solo podemos atender mensajes de texto. ¿Podría escribirnos su consulta?'); return; }
    console.log(`[Bot] ${msg.name} (${msg.from}): ${msg.text.substring(0, 100)}`);
    await markAsRead(msg.messageId);
    const offHours = isOutOfService();
    const response = await chat(msg.from, msg.name, msg.text, offHours);
    await sendMessage(msg.from, response.reply);
    if (response.isUrgent) {
      console.log(`[Bot] ⚠️ URGENTE: ${response.summary}`);
      await sendUrgentAlert({ clientPhone: msg.from, clientName: msg.name, summary: response.summary, messageText: msg.text });
    } else if (response.summary && response.summary !== 'Error técnico') {
      await sendInfoNotification({ clientPhone: msg.from, clientName: msg.name, summary: response.summary });
    }
  } catch (err) { console.error('[Bot] Error:', err); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot activo en puerto ${PORT}`));
EOF

# 5. Crear .env plantilla
cat > .env << 'ENVFILE'
WHATSAPP_TOKEN=PEGA_TU_TOKEN_AQUI
WHATSAPP_PHONE_ID=1106797265840821
WHATSAPP_VERIFY_TOKEN=investigalo_secreto_2026
GEMINI_API_KEY=PEGA_TU_API_KEY_GEMINI_AQUI
NTFY_TOPIC=investigalo-urgencias-cambia-esto
PORT=3000
TZ=Europe/Madrid
ENVFILE

# 6. Instalar dependencias
echo "[3/6] Instalando dependencias..."
npm install > /dev/null 2>&1
echo "✅ Dependencias instaladas"

# 7. Crear servicio systemd
echo "[4/6] Configurando servicio..."
cat > /etc/systemd/system/whatsapp-bot.service << 'SVCFILE'
[Unit]
Description=WhatsApp Bot Investigalo
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/whatsapp-bot
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SVCFILE

sudo systemctl daemon-reload
sudo systemctl enable whatsapp-bot > /dev/null 2>&1
echo "✅ Servicio configurado"

echo ""
echo "=========================================="
echo " ✅ INSTALACIÓN COMPLETADA"
echo "=========================================="
echo ""
echo "PASOS QUE FALTAN:"
echo "1. Edita /opt/whatsapp-bot/.env con tus tokens reales:"
echo "   nano /opt/whatsapp-bot/.env"
echo ""
echo "2. Configura nginx (subdominio + HTTPS):"
echo "   - Crea registro DNS tipo A: bot.investigalo-detectives.com → IP_DEL_SERVER"
echo "   - Luego ejecuta el script setup-nginx.sh"
echo ""
echo "3. Inicia el bot:"
echo "   sudo systemctl start whatsapp-bot"
echo "   sudo journalctl -u whatsapp-bot -f"
echo ""
