const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Contactos
const getContact = (phone) => pool.query('SELECT * FROM contacts WHERE phone = $1', [phone]);
const createContact = (phone, name) => pool.query('INSERT INTO contacts (phone, name) VALUES ($1, $2) RETURNING *', [phone, name]);
const getAllContacts = () => pool.query('SELECT * FROM contacts ORDER BY created_at DESC');

// Conversaciones
const getConversation = (contactId) => pool.query('SELECT * FROM conversations WHERE contact_id = $1', [contactId]);
const createConversation = (contactId) => pool.query('INSERT INTO conversations (contact_id) VALUES ($1) RETURNING *', [contactId]);
const getAllConversations = () => pool.query(`
  SELECT
    c.id,
    c.contact_id,
    c.bot_enabled,
    c.last_message_at,
    c.created_at,
    co.phone,
    co.name as contact_name
  FROM conversations c
  LEFT JOIN contacts co ON c.contact_id = co.id
  ORDER BY c.last_message_at DESC
`);

// Mensajes
const saveMessage = (conversationId, direction, text, fromBot) => pool.query(
  'INSERT INTO messages (conversation_id, direction, text, from_bot) VALUES ($1, $2, $3, $4) RETURNING *',
  [conversationId, direction, text, fromBot]
);
const getConversationMessages = (conversationId) => pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conversationId]);

// Bot status
const getBotStatus = (conversationId) => pool.query('SELECT * FROM bot_status WHERE conversation_id = $1', [conversationId]);
const toggleBot = (conversationId, enabled) => pool.query(
  'INSERT INTO bot_status (conversation_id, enabled) VALUES ($1, $2) ON CONFLICT (conversation_id) DO UPDATE SET enabled = $2 RETURNING *',
  [conversationId, enabled]
);

// Casos (CRM Kanban)
const getAllCases = () => pool.query('SELECT * FROM cases ORDER BY created_at DESC');
const getCasesByStatus = (status) => pool.query('SELECT * FROM cases WHERE status = $1 ORDER BY created_at DESC', [status]);
const getCaseByConversation = (conversationId) => pool.query('SELECT * FROM cases WHERE conversation_id = $1', [conversationId]);
const createCase = (conversationId, clientPhone, status = 'urgente') => pool.query(
  'INSERT INTO cases (conversation_id, client_phone, status) VALUES ($1, $2, $3) RETURNING *',
  [conversationId, clientPhone, status]
);
const updateCaseStatus = (caseId, status) => pool.query(
  'UPDATE cases SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
  [status, caseId]
);
const updateCaseNotes = (caseId, notes) => pool.query(
  'UPDATE cases SET notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
  [notes, caseId]
);
const updateCaseSummary = (caseId, summary) => pool.query(
  'UPDATE cases SET summary = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
  [summary, caseId]
);

module.exports = {
  pool,
  getContact, createContact, getAllContacts,
  getConversation, createConversation, getAllConversations,
  saveMessage, getConversationMessages,
  getBotStatus, toggleBot,
  getAllCases, getCasesByStatus, getCaseByConversation, createCase, updateCaseStatus, updateCaseNotes, updateCaseSummary
};
