const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  // Función para guardar mensajes sin repetir código
  saveMessage: async (botId, clientPhone, sender, text) => {
    try {
      await pool.query(
        'INSERT INTO messages (bot_id, client_phone, sender, text) VALUES ($1, $2, $3, $4)',
        [botId, clientPhone, sender, text]
      );
    } catch (err) {
      console.error("❌ [DB Error] No se pudo guardar el mensaje:", err.message);
    }
  }
};