const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSystemPrompt } = require('./prompt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Almacén de conversaciones en memoria (por número de teléfono)
// En producción podrías usar Redis o SQLite para persistencia
const conversations = new Map();

// Limpiar conversaciones antiguas cada hora (más de 24h sin actividad)
setInterval(() => {
  const now = Date.now();
  for (const [key, conv] of conversations) {
    if (now - conv.lastActivity > 24 * 60 * 60 * 1000) {
      conversations.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Obtiene o crea el historial de conversación para un cliente
 */
function getConversation(phoneNumber) {
  if (!conversations.has(phoneNumber)) {
    conversations.set(phoneNumber, {
      history: [],
      lastActivity: Date.now()
    });
  }
  const conv = conversations.get(phoneNumber);
  conv.lastActivity = Date.now();
  return conv;
}

/**
 * Envía un mensaje a Gemini y obtiene la respuesta + clasificación
 * Retorna: { reply: string, isUrgent: boolean, summary: string }
 */
async function chat(phoneNumber, clientName, messageText, isOffHours) {
  const conv = getConversation(phoneNumber);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: getSystemPrompt(isOffHours)
  });

  // Añadir mensaje del cliente al historial
  conv.history.push({ role: 'user', parts: [{ text: messageText }] });

  // Limitar historial a últimos 20 mensajes para no exceder tokens
  const recentHistory = conv.history.slice(-20);

  try {
    const chatSession = model.startChat({ history: recentHistory.slice(0, -1) });
    const result = await chatSession.sendMessage(messageText);
    const rawResponse = result.response.text();

    // Parsear respuesta estructurada de Gemini
    const parsed = parseResponse(rawResponse);

    // Guardar respuesta en historial
    conv.history.push({ role: 'model', parts: [{ text: rawResponse }] });

    return {
      reply: parsed.reply,
      isUrgent: parsed.isUrgent,
      summary: parsed.summary
    };
  } catch (err) {
    console.error('[Gemini] Error:', err.message);
    return {
      reply: 'Disculpe, estamos teniendo dificultades técnicas. Por favor, inténtelo de nuevo en unos minutos o llámenos directamente en horario de oficina (8:00 - 20:00).',
      isUrgent: false,
      summary: 'Error técnico'
    };
  }
}

/**
 * Parsea la respuesta estructurada de Gemini
 * Gemini responde en formato:
 * [URGENCIA:SI/NO]
 * [RESUMEN:texto breve]
 * [RESPUESTA]
 * texto de la respuesta al cliente
 */
function parseResponse(raw) {
  let isUrgent = false;
  let summary = '';
  let reply = raw;

  // Extraer urgencia
  const urgMatch = raw.match(/\[URGENCIA:(SI|NO)\]/i);
  if (urgMatch) {
    isUrgent = urgMatch[1].toUpperCase() === 'SI';
  }

  // Extraer resumen
  const sumMatch = raw.match(/\[RESUMEN:(.+?)\]/i);
  if (sumMatch) {
    summary = sumMatch[1].trim();
  }

  // Extraer respuesta limpia (todo después de [RESPUESTA])
  const respMatch = raw.split(/\[RESPUESTA\]\n?/i);
  if (respMatch.length > 1) {
    reply = respMatch[1].trim();
  } else {
    // Si no viene formateado, limpiar las etiquetas
    reply = raw
      .replace(/\[URGENCIA:(SI|NO)\]\n?/gi, '')
      .replace(/\[RESUMEN:.+?\]\n?/gi, '')
      .replace(/\[RESPUESTA\]\n?/gi, '')
      .trim();
  }

  return { reply, isUrgent, summary };
}

module.exports = { chat };
