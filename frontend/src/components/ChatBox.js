import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function ChatBox({ conversationId, botEnabled, onToggleBot, contactName, phoneNumber }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.io
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for new messages from WhatsApp
    newSocket.on('new_message', (msgData) => {
      console.log('📨 New message from WhatsApp:', msgData);
      // If the message is for this conversation, reload messages
      if (msgData.conversationId === conversationId) {
        loadMessages();
      }
    });

    return () => newSocket.close();
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) loadMessages();
  }, [conversationId]);

  async function loadMessages() {
    try {
      const res = await axios.get(`http://localhost:5000/api/conversations/${conversationId}/messages`);
      setMessages(res.data);
      setTimeout(() => {
        const chatBox = document.getElementById('chat-messages');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
      }, 100);
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    }
  }

  async function sendMessage() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      if (!phoneNumber) {
        throw new Error('No phone number found for this conversation');
      }

      // Send message to WhatsApp via the new endpoint
      await axios.post('http://localhost:5000/api/messages/send-whatsapp', {
        conversationId,
        clientPhone: phoneNumber,
        text
      });

      setText('');
      loadMessages();
    } catch (err) {
      console.error('Error enviando:', err);
      alert('Error al enviar mensaje: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  }

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#efeae2',
      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23efeae2%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2240%22 y=%2260%22 font-size=%2240%22 opacity=%220.08%22%3E📱%3C/text%3E%3Ctext x=%22120%22 y=%22100%22 font-size=%2240%22 opacity=%220.08%22%3E💬%3C/text%3E%3Ctext x=%22200%22 y=%2240%22 font-size=%2240%22 opacity=%220.08%22%3E📞%3C/text%3E%3Ctext x=%2280%22 y=%22180%22 font-size=%2240%22 opacity=%220.08%22%3E📸%3C/text%3E%3Ctext x=%22280%22 y=%22120%22 font-size=%2240%22 opacity=%220.08%22%3E🎥%3C/text%3E%3Ctext x=%2340%22 y=%22280%22 font-size=%2240%22 opacity=%220.08%22%3E😊%3C/text%3E%3Ctext x=%22160%22 y=%22260%22 font-size=%2240%22 opacity=%220.08%22%3E❤️%3C/text%3E%3Ctext x=%22280%22 y=%22300%22 font-size=%2240%22 opacity=%220.08%22%3E⭐%3C/text%3E%3Ctext x=%22340%22 y=%2240%22 font-size=%2240%22 opacity=%220.08%22%3E🔔%3C/text%3E%3Ctext x=%2220%22 y=%22350%22 font-size=%2240%22 opacity=%220.08%22%3E📍%3C/text%3E%3C/svg%3E")',
      backgroundSize: '400px 400px',
      backgroundAttachment: 'fixed',
      position: 'relative',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>{contactName}</span>
        <button
          onClick={() => onToggleBot(!botEnabled)}
          style={{
            padding: '5px 11px',
            backgroundColor: botEnabled ? '#00a884' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Bot {botEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Messages */}
      <div
        id="chat-messages"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxSizing: 'border-box',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.direction === 'out' ? 'flex-end' : 'flex-start',
              paddingRight: msg.direction === 'out' ? '8px' : '0',
              paddingLeft: msg.direction === 'out' ? '0' : '8px',
              minWidth: 0,
            }}
          >
            <div
              style={{
                backgroundColor: msg.direction === 'out' ? '#dcf8c6' : 'white',
                padding: '6px 10px',
                borderRadius: msg.direction === 'out' ? '15px 15px 3px 15px' : '15px 15px 15px 3px',
                maxWidth: '70%',
                minWidth: 0,
                wordBreak: 'break-word',
                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
              }}
            >
              <p style={{ margin: '0 0 3px 0', fontSize: '13px', lineHeight: '1.4', color: '#000' }}>
                {msg.text}
              </p>
              {msg.from_bot && (
                <div style={{
                  marginTop: '3px',
                  paddingTop: '3px',
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  fontSize: '9px',
                  color: '#00a884',
                  fontWeight: '500',
                }}>
                  🤖 Bot
                </div>
              )}
              <div style={{
                margin: '3px 0 0 0',
                fontSize: '11px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: msg.direction === 'out' ? 'flex-end' : 'flex-start',
                gap: '3px'
              }}>
                <span>{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.direction === 'out' && (
                  <span style={{ color: '#00a884', fontWeight: 'bold' }}>✓✓</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Footer */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: 'white',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}>
        <input
          type="text"
          placeholder="Escribir mensaje..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '9px 14px',
            borderRadius: '20px',
            backgroundColor: '#f0f0f0',
            border: 'none',
            fontSize: '13px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            borderRadius: '50%',
            backgroundColor: '#00a884',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
