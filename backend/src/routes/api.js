const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { sendMessage: sendWhatsAppMessage } = require('../services/meta');

// CONTACTOS
router.get('/contacts', async (req, res) => {
  try {
    const result = await db.getAllContacts();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contacts', async (req, res) => {
  const { phone, name } = req.body;
  try {
    const result = await db.createContact(phone, name);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CREATE NEW CONVERSATION WITH PHONE NUMBER
router.post('/conversations/create-with-phone', async (req, res) => {
  const { phone, name = 'Cliente' } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Check if contact exists
    let contact = await db.getContact(phone);
    let contactId;

    if (contact.rows.length === 0) {
      // Create new contact
      contact = await db.createContact(phone, name);
      contactId = contact.rows[0].id;
    } else {
      contactId = contact.rows[0].id;
      // Update name if provided
      if (name && name !== 'Cliente') {
        // Optional: update contact name
      }
    }

    // Check if conversation exists
    let conversation = await db.getConversation(contactId);

    if (conversation.rows.length === 0) {
      // Create new conversation
      conversation = await db.createConversation(contactId);
    }

    const conversationId = conversation.rows[0].id;

    // Return the conversation with contact details
    const fullConversation = await db.getAllConversations();
    const result = fullConversation.rows.find(c => c.id === conversationId);

    res.json({
      success: true,
      conversation: result,
      isNew: conversation.rows.length > 0
    });
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(400).json({ error: err.message });
  }
});

// CONVERSACIONES
router.get('/conversations', async (req, res) => {
  try {
    const result = await db.getAllConversations();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const result = await db.getConversation(req.params.id);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MENSAJES
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const result = await db.getConversationMessages(req.params.id);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/messages', async (req, res) => {
  const { conversationId, direction, text, fromBot } = req.body;
  try {
    const result = await db.saveMessage(conversationId, direction, text, fromBot);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// SEND TO WHATSAPP
router.post('/messages/send-whatsapp', async (req, res) => {
  const { conversationId, clientPhone, text } = req.body;

  if (!conversationId || !clientPhone || !text) {
    return res.status(400).json({ error: 'Missing required fields: conversationId, clientPhone, text' });
  }

  try {
    // Save message to database first
    await db.saveMessage(conversationId, 'out', text, false);

    // Send via WhatsApp (phone number should be without + or spaces)
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const result = await sendWhatsAppMessage(cleanPhone, text);

    res.json({
      success: true,
      message: 'Message sent to WhatsApp',
      whatsappMessageId: result.messages[0].id
    });
  } catch (err) {
    console.error('Error sending WhatsApp message:', err);
    res.status(400).json({ error: err.message });
  }
});

// BOT TOGGLE
router.post('/conversations/:id/toggle-bot', async (req, res) => {
  const { enabled } = req.body;
  try {
    const result = await db.toggleBot(req.params.id, enabled);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/conversations/:id/bot-status', async (req, res) => {
  try {
    const result = await db.getBotStatus(req.params.id);
    res.json(result.rows[0] || { enabled: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CASOS (CRM Kanban)
router.get('/cases', async (req, res) => {
  try {
    const result = await db.getAllCases();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cases/status/:status', async (req, res) => {
  try {
    const result = await db.getCasesByStatus(req.params.status);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id/case', async (req, res) => {
  try {
    const result = await db.getCaseByConversation(req.params.id);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cases', async (req, res) => {
  const { conversationId, clientPhone, status } = req.body;
  try {
    const result = await db.createCase(conversationId, clientPhone, status);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/cases/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await db.updateCaseStatus(req.params.id, status);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/cases/:id/notes', async (req, res) => {
  const { notes } = req.body;
  try {
    const result = await db.updateCaseNotes(req.params.id, notes);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/cases/:id/summary', async (req, res) => {
  const { summary } = req.body;
  try {
    const result = await db.updateCaseSummary(req.params.id, summary);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// TEST WHATSAPP CREDENTIALS
router.get('/test-whatsapp', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_ID}`,
      {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
      }
    );
    res.json({
      success: true,
      phoneId: response.data.id,
      status: 'Token is valid ✅'
    });
  } catch (err) {
    res.status(401).json({
      error: 'Token verification failed',
      details: err.response?.data || err.message
    });
  }
});

module.exports = router;
