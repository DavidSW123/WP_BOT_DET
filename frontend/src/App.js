import { HStack, VStack, Button, useMediaQuery } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Inbox from './components/Inbox';
import ChatBox from './components/ChatBox';
import CasesBoard from './components/CasesBoard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [botEnabled, setBotEnabled] = useState(true);
  const [globalBotEnabled, setGlobalBotEnabled] = useState(true);
  const [view, setView] = useState('chat');
  const [chatView, setChatView] = useState('list'); // 'list' or 'chat' for mobile
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const res = await axios.get(`${API_URL}/api/conversations`);
      setConversations(res.data);
      if (res.data.length > 0 && !selectedId) setSelectedId(res.data[0].id);
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
    }
  }

  function handleConversationCreated(conversationId) {
    loadConversations();
    setSelectedId(conversationId);
    if (isMobile) setChatView('chat');
  }

  async function handleToggleBot(enabled) {
    try {
      await axios.post(`${API_URL}/api/conversations/${selectedId}/toggle-bot`, { enabled });
      setBotEnabled(enabled);
    } catch (err) {
      console.error('Error toggling bot:', err);
    }
  }

  const handleSelectConversation = (convId) => {
    setSelectedId(convId);
    if (isMobile) setChatView('chat');
  };

  return (
    <VStack spacing={0} h="100vh" w="100vw">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        borderBottom: '2px solid #e5e7eb',
        padding: isMobile ? '8px 12px' : '12px 16px',
        gap: isMobile ? '8px' : '12px',
        flexWrap: 'wrap',
        minHeight: isMobile ? '50px' : '65px'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setView('chat')}
            style={{
              padding: isMobile ? '8px 12px' : '10px 16px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              background: view === 'chat' ? '#3182ce' : '#e2e8f0',
              color: view === 'chat' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            💬 {!isMobile && 'Chat'}
          </button>
          <button
            onClick={() => setView('casos')}
            style={{
              padding: isMobile ? '8px 12px' : '10px 16px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              background: view === 'casos' ? '#3182ce' : '#e2e8f0',
              color: view === 'casos' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            📋 {!isMobile && 'Casos'}
          </button>
        </div>

        <button
          onClick={() => setGlobalBotEnabled(!globalBotEnabled)}
          style={{
            padding: isMobile ? '8px 10px' : '8px 14px',
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: '600',
            background: globalBotEnabled ? '#00a884' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            minHeight: '44px',
            whiteSpace: 'nowrap'
          }}
        >
          🤖 {!isMobile && 'Global:'} {globalBotEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Contenido */}
      <VStack spacing={0} h="calc(100% - 65px)" w="100%" flex={1} style={{ overflow: 'hidden' }}>
        {view === 'chat' && (
          isMobile ? (
            // Mobile: Toggle between list and chat
            <>
              {chatView === 'list' && (
                <Inbox
                  conversations={conversations}
                  onSelect={handleSelectConversation}
                  selectedId={selectedId}
                  onConversationCreated={handleConversationCreated}
                />
              )}
              {chatView === 'chat' && selectedId && (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <button
                    onClick={() => setChatView('list')}
                    style={{
                      padding: '10px',
                      background: '#f0f0f0',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      height: '44px'
                    }}
                  >
                    ← Volver
                  </button>
                  <div style={{ flex: 1, overflow: 'hidden', width: '100%' }}>
                    <ChatBox
                      conversationId={selectedId}
                      botEnabled={botEnabled}
                      onToggleBot={handleToggleBot}
                      contactName={conversations.find(c => c.id === selectedId)?.contact_name || 'Chat'}
                      phoneNumber={conversations.find(c => c.id === selectedId)?.phone}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            // Desktop: Side by side
            <HStack spacing={0} h="100%" w="100%">
              <Inbox
                conversations={conversations}
                onSelect={setSelectedId}
                selectedId={selectedId}
                onConversationCreated={handleConversationCreated}
              />
              {selectedId && (
                <ChatBox
                  conversationId={selectedId}
                  botEnabled={botEnabled}
                  onToggleBot={handleToggleBot}
                  contactName={conversations.find(c => c.id === selectedId)?.contact_name || 'Chat'}
                  phoneNumber={conversations.find(c => c.id === selectedId)?.phone}
                />
              )}
            </HStack>
          )
        )}
        {view === 'casos' && <CasesBoard />}
      </VStack>
    </VStack>
  );
}
