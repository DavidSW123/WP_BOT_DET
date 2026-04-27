import { Box, List, ListItem, Text, VStack, HStack, Badge, Button, Input } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Inbox({ conversations, onSelect, selectedId, onConversationCreated }) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateConversation() {
    if (!newPhone.trim()) return;
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/conversations/create-with-phone', {
        phone: newPhone.trim(),
        name: newName.trim() || 'Cliente'
      });

      // Reset form
      setNewPhone('');
      setNewName('');
      setShowNewForm(false);

      // Notify parent and select the new conversation
      if (onConversationCreated) {
        onConversationCreated(response.data.conversation.id);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateConversation();
    }
  };

  return (
    <Box w="30%" borderRight="1px" borderColor="gray.200" h="100%" display="flex" flexDirection="column" bg="gray.50">
      {/* Header */}
      <Box p={4} borderBottom="2px" borderColor="#e5e7eb" bg="white" boxShadow="0 1px 2px rgba(0,0,0,0.08)">
        <VStack align="stretch" spacing={3}>
          <Text fontSize="16px" fontWeight="700" color="gray.800">Conversaciones</Text>

          {!showNewForm ? (
            <Button
              size="sm"
              colorScheme="blue"
              w="100%"
              onClick={() => setShowNewForm(true)}
              fontSize="13px"
            >
              ➕ Nueva Conversación
            </Button>
          ) : (
            <VStack spacing={2} align="stretch">
              <Input
                placeholder="Teléfono (ej: 34912345678)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                onKeyPress={handleKeyPress}
                size="sm"
                autoFocus
              />
              <Input
                placeholder="Nombre (opcional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={handleKeyPress}
                size="sm"
              />
              <HStack spacing={2}>
                <Button
                  size="sm"
                  colorScheme="green"
                  flex={1}
                  isLoading={loading}
                  onClick={handleCreateConversation}
                  fontSize="12px"
                >
                  Crear
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  flex={1}
                  onClick={() => {
                    setShowNewForm(false);
                    setNewPhone('');
                    setNewName('');
                  }}
                  fontSize="12px"
                >
                  Cancelar
                </Button>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Lista */}
      <Box overflowY="auto" flex={1}>
        <List spacing={0}>
        {conversations.map(conv => (
          <ListItem
            key={conv.id}
            p={3}
            borderBottom="1px"
            borderColor="gray.100"
            cursor="pointer"
            bg={selectedId === conv.id ? 'blue.50' : 'white'}
            _hover={{ bg: 'gray.50' }}
            onClick={() => onSelect(conv.id)}
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{conv.contact_name || 'Sin nombre'}</Text>
                <Text fontSize="sm" color="gray.500">{conv.phone}</Text>
              </VStack>
              <Badge colorScheme={conv.bot_enabled ? 'green' : 'red'}>
                {conv.bot_enabled ? 'Bot ON' : 'Bot OFF'}
              </Badge>
            </HStack>
          </ListItem>
        ))}
        </List>
      </Box>
    </Box>
  );
}
