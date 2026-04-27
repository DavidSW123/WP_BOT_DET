import { HStack, VStack, Button } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Inbox from './components/Inbox';
import ChatBox from './components/ChatBox';
import CasesBoard from './components/CasesBoard';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [botEnabled, setBotEnabled] = useState(true);
  const [globalBotEnabled, setGlobalBotEnabled] = useState(true);
  const [view, setView] = useState('chat');

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const res = await axios.get('http://localhost:5000/api/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !selectedId) setSelectedId(res.data[0].id);
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
    }
  }

  function handleConversationCreated(conversationId) {
    loadConversations();
    setSelectedId(conversationId);
  }

  async function handleToggleBot(enabled) {
    try {
      await axios.post(`http://localhost:5000/api/conversations/${selectedId}/toggle-bot`, { enabled });
      setBotEnabled(enabled);
    } catch (err) {
      console.error('Error toggling bot:', err);
    }
  }

  return (
    <VStack spacing={0} h="100vh" w="100vw">
      {/* Header con botones de navegación */}
      <HStack spacing={3} bg="white" borderBottom="2px" borderColor="blue.100" px={4} py={3} w="100%" boxShadow="sm" justify="space-between">
        <HStack spacing={3}>
          <Button
            variant={view === 'chat' ? 'solid' : 'ghost'}
            colorScheme={view === 'chat' ? 'blue' : 'gray'}
            onClick={() => setView('chat')}
            size="md"
            fontSize="14px"
            fontWeight="600"
            borderRadius="md"
          >
            💬 Chat
          </Button>
          <Button
            variant={view === 'casos' ? 'solid' : 'ghost'}
            colorScheme={view === 'casos' ? 'blue' : 'gray'}
            onClick={() => setView('casos')}
            size="md"
            fontSize="14px"
            fontWeight="600"
            borderRadius="md"
          >
            📋 Casos
          </Button>
        </HStack>

        <Button
          size="sm"
          bg={globalBotEnabled ? '#00a884' : '#dc2626'}
          color="white"
          onClick={() => setGlobalBotEnabled(!globalBotEnabled)}
          _hover={{ opacity: 0.8 }}
          fontSize="12px"
          fontWeight="600"
        >
          🤖 Bot Global: {globalBotEnabled ? 'ON' : 'OFF'}
        </Button>
      </HStack>

      {/* Contenido */}
      <VStack spacing={0} h="calc(100% - 65px)" w="100%" flex={1}>
        {view === 'chat' && (
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
        )}
        {view === 'casos' && <CasesBoard />}
      </VStack>
    </VStack>
  );
}
