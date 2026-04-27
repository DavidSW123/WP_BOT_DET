import { Box, VStack, HStack, Text, Button, Menu, MenuButton, MenuList, MenuItem, Tooltip } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

export default function CaseCard({ caseData, onSelect, onMove, currentStatus }) {
  const getStatusColor = (status) => {
    if (status === 'urgente') return 'red';
    if (status === 'revision') return 'yellow';
    if (status === 'aceptado') return 'green';
    return 'gray';
  };

  const getOtherStatuses = (current) => {
    const all = ['urgente', 'revision', 'aceptado'];
    return all.filter(s => s !== current);
  };

  return (
    <Box
      p={3}
      bg="gray.50"
      borderRadius="md"
      borderLeft="4px"
      borderLeftColor={`${getStatusColor(currentStatus)}.500`}
      cursor="pointer"
      _hover={{ bg: 'gray.100', boxShadow: 'md' }}
      transition="all 0.2s"
    >
      <VStack align="start" spacing={2}>
        {/* Número de teléfono */}
        <HStack justify="space-between" w="100%">
          <Text fontWeight="bold" fontSize="sm" color="blue.600">
            {caseData.client_phone}
          </Text>
          <Tooltip label="Mover caso">
            <Menu>
              <MenuButton as={Button} size="xs" variant="ghost">
                <ChevronDownIcon />
              </MenuButton>
              <MenuList fontSize="sm">
                {getOtherStatuses(currentStatus).map(status => (
                  <MenuItem
                    key={status}
                    onClick={() => onMove(caseData.id, status)}
                  >
                    {status === 'urgente' && '🔴 Urgente'}
                    {status === 'revision' && '⏳ Por Revisar'}
                    {status === 'aceptado' && '✅ Aceptado'}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </Tooltip>
        </HStack>

        {/* Resumen de IA (si existe) */}
        {caseData.summary && (
          <Text fontSize="xs" color="gray.600" noOfLines={2}>
            💡 {caseData.summary}
          </Text>
        )}

        {/* Botón para ver notas */}
        <Button
          size="xs"
          colorScheme="blue"
          variant="outline"
          w="100%"
          onClick={() => onSelect(caseData)}
        >
          Ver Notas
        </Button>

        {/* Fecha de creación */}
        <Text fontSize="xs" color="gray.500">
          {new Date(caseData.created_at).toLocaleDateString('es-ES')}
        </Text>
      </VStack>
    </Box>
  );
}
