import { Box, VStack, HStack, Text, Badge, Button, SimpleGrid } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import CaseCard from './CaseCard';

export default function CasesBoard() {
  const [cases, setCases] = useState({ urgente: [], revision: [], aceptado: [] });
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/cases');
      const organized = { urgente: [], revision: [], aceptado: [] };

      res.data.forEach(c => {
        if (organized[c.status]) {
          organized[c.status].push(c);
        }
      });

      setCases(organized);
    } catch (err) {
      console.error('Error cargando casos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function moveCase(caseId, newStatus) {
    try {
      await axios.patch(`http://localhost:5000/api/cases/${caseId}/status`, { status: newStatus });
      loadCases();
    } catch (err) {
      console.error('Error moviendo caso:', err);
    }
  }

  async function updateNotes(caseId, notes) {
    try {
      await axios.patch(`http://localhost:5000/api/cases/${caseId}/notes`, { notes });
      loadCases();
    } catch (err) {
      console.error('Error guardando notas:', err);
    }
  }

  return (
    <Box w="100%" h="100%" p={6} bg="gray.50" overflowY="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">📋 Gestión de Casos</Text>
          <Button colorScheme="blue" size="sm" onClick={loadCases} isLoading={loading}>
            Actualizar
          </Button>
        </HStack>

        {/* Kanban Board */}
        <SimpleGrid columns={3} spacing={4} w="100%">
          {/* Columna: Urgentes */}
          <Box bg="white" borderRadius="lg" p={4} boxShadow="sm" borderTop="4px" borderTopColor="red.500">
            <HStack mb={4} pb={3} borderBottom="2px" borderColor="red.100">
              <Text fontSize="lg" fontWeight="bold" color="red.600">🔴 Urgentes</Text>
              <Badge colorScheme="red">{cases.urgente.length}</Badge>
            </HStack>
            <VStack spacing={3} align="stretch">
              {cases.urgente.map(c => (
                <CaseCard
                  key={c.id}
                  caseData={c}
                  onSelect={setSelectedCase}
                  onMove={moveCase}
                  currentStatus="urgente"
                />
              ))}
            </VStack>
          </Box>

          {/* Columna: Por Revisar */}
          <Box bg="white" borderRadius="lg" p={4} boxShadow="sm" borderTop="4px" borderTopColor="yellow.500">
            <HStack mb={4} pb={3} borderBottom="2px" borderColor="yellow.100">
              <Text fontSize="lg" fontWeight="bold" color="yellow.600">⏳ Por Revisar</Text>
              <Badge colorScheme="yellow">{cases.revision.length}</Badge>
            </HStack>
            <VStack spacing={3} align="stretch">
              {cases.revision.map(c => (
                <CaseCard
                  key={c.id}
                  caseData={c}
                  onSelect={setSelectedCase}
                  onMove={moveCase}
                  currentStatus="revision"
                />
              ))}
            </VStack>
          </Box>

          {/* Columna: Aceptados */}
          <Box bg="white" borderRadius="lg" p={4} boxShadow="sm" borderTop="4px" borderTopColor="green.500">
            <HStack mb={4} pb={3} borderBottom="2px" borderColor="green.100">
              <Text fontSize="lg" fontWeight="bold" color="green.600">✅ Aceptados</Text>
              <Badge colorScheme="green">{cases.aceptado.length}</Badge>
            </HStack>
            <VStack spacing={3} align="stretch">
              {cases.aceptado.map(c => (
                <CaseCard
                  key={c.id}
                  caseData={c}
                  onSelect={setSelectedCase}
                  onMove={moveCase}
                  currentStatus="aceptado"
                />
              ))}
            </VStack>
          </Box>
        </SimpleGrid>
      </VStack>

      {/* Modal de caso (implementar después) */}
    </Box>
  );
}
