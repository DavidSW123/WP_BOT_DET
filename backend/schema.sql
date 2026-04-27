-- Crear base de datos
CREATE DATABASE crm_whatsapp;

-- Tabla contactos
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla conversaciones
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  contact_id INT REFERENCES contacts(id),
  bot_enabled BOOLEAN DEFAULT TRUE,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla mensajes
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id),
  direction VARCHAR(10), -- 'in' o 'out'
  text TEXT,
  from_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla configuración bot por conversación
CREATE TABLE bot_status (
  id SERIAL PRIMARY KEY,
  conversation_id INT UNIQUE REFERENCES conversations(id),
  enabled BOOLEAN DEFAULT TRUE,
  mode VARCHAR(20), -- 'auto', 'manual', 'hybrid'
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de casos (CRM Kanban)
CREATE TABLE cases (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id),
  status VARCHAR(50) DEFAULT 'urgente', -- 'urgente', 'revision', 'aceptado'
  client_phone VARCHAR(20) NOT NULL,
  summary TEXT, -- Resumen automático de IA
  notes TEXT, -- Notas del detective
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_cases_conversation ON cases(conversation_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_phone ON cases(client_phone);
