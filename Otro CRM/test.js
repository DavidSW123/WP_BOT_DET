const db = require('./src/db');
db.query('SELECT * FROM messages').then(res => {
    console.log("✅ ¡Conectado! Mensaje de prueba:", res.rows[0].text);
    process.exit();
}).catch(e => console.error("❌ Error:", e));