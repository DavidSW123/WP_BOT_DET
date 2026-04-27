const axios = require('axios');
require('dotenv').config();

const WHATSAPP_API_URL = 'https://graph.instagram.com/v18.0';
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

/**
 * Send a text message via WhatsApp
 * @param {string} recipientPhone - Phone number in format: 34123456789 (without +)
 * @param {string} messageText - Message content
 * @returns {Promise<Object>} Response from WhatsApp API
 */
async function sendMessage(recipientPhone, messageText) {
  if (!PHONE_ID || !TOKEN) {
    throw new Error('WhatsApp credentials not configured');
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: { body: messageText }
      },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      data: response.data
    };
  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    throw new Error(
      `Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`
    );
  }
}

/**
 * Send a message with template (optional, for future use)
 */
async function sendTemplateMessage(recipientPhone, templateName, languageCode = 'es') {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      data: response.data
    };
  } catch (error) {
    console.error('WhatsApp Template API Error:', error.response?.data || error.message);
    throw new Error(`Failed to send WhatsApp template: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = {
  sendMessage,
  sendTemplateMessage
};
