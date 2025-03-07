import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Flex, 
  Badge, 
  Divider, 
  Button, 
  useToast,
  Spinner,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Stack,
  StackDivider,
  HStack,
  VStack,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea
} from '@chakra-ui/react';
import { 
  ArrowBackIcon, 
  EditIcon, 
  DeleteIcon, 
  CheckIcon, 
  CloseIcon,
  DownloadIcon,
  PrintIcon
} from '@chakra-ui/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import NotesList from '../components/Notes/NotesList';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    client: '',
    amount: '',
    rate: '',
    status: '',
    description: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Cargar detalles de la transacción
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        const response = await axios.get(`/api/transactions/${id}`);
        setTransaction(response.data);
        
        // Inicializar formulario de edición
        setEditForm({
          client: response.data.client,
          amount: response.data.amount,
          rate: response.data.rate,
          status: response.data.status,
          description: response.data.description || ''
        });
      } catch (error) {
        console.error('Error al cargar detalles de la transacción:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los detalles de la transacción',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactionDetails();
  }, [id, toast]);
  
  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };
  
  // Actualizar transacción
  const updateTransaction = async () => {
    setFormSubmitting(true);
    
    try {
      const response = await axios.put(`/api/transactions/${id}`, editForm);
      setTransaction(response.data);
      
      toast({
        title: 'Éxito',
        description: 'Transacción actualizada correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Error al actualizar la transacción:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al actualizar la transacción',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Eliminar transacción
  const deleteTransaction = async () => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta transacción?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/transactions/${id}`);
      
      toast({
        title: 'Éxito',
        description: 'Transacción eliminada correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/transactions');
    } catch (error) {
      console.error('Error al eliminar la transacción:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al eliminar la transacción',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Generar recibo
  const generateReceipt = async () => {
    try {
      const response = await axios.get(`/api/transactions/${id}/receipt`, {
        responseType: 'blob'
      });
      
      // Crear URL para el blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Crear enlace temporal y hacer clic en él
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recibo-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar recibo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el recibo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Renderizar badge de estado
  const renderStatusBadge = (status) => {
    let color;
    
    switch (status) {
      case 'completada':
        color = 'green';
        break;
      case 'pendiente':
        color = 'yellow';
        break;
      case 'cancelada':
        color = 'red';
        break;
      default:
        color = 'gray';
    }
    
    return (
      <Badge colorScheme={color} fontSize="0.8em" p={1} borderRadius="md">
        {status.toUpperCase()}
      </Badge>
    );
  };
  
  // Renderizar badge de tipo
  const renderTypeBadge = (type) => {
    let color;
    let label;
    
    switch (type) {
      case 'venta':
        color = 'green';
        label = 'VENTA';
        break;
      case 'canje':
        color = 'purple';
        label = 'CANJE';
        break;
      default:
        color = 'gray';
        label = type.toUpperCase();
    }
    
    return (
      <Badge colorScheme={color} fontSize="0.8em" p={1} borderRadius="md">
        {label}
      </Badge>
    );
  };
  
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }
  
  if (!transaction) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Heading size="lg" mb={4}>Transacción no encontrada</Heading>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            colorScheme="blue" 
            onClick={() => navigate('/transactions')}
          >
            Volver a transacciones
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      {/* Encabezado */}
      <Flex justify="space-between" align="center" mb={6}>
        <Button 
          leftIcon={<ArrowBackIcon />} 
          variant="outline" 
          onClick={() => navigate('/transactions')}
        >
          Volver
        </Button>
        
        <Heading size="lg">
          Detalles de la Operación
        </Heading>
        
        <HStack>
          {user.role === 'admin' && (
            <>
              <IconButton
                icon={<EditIcon />}
                colorScheme="blue"
                onClick={onOpen}
                aria-label="Editar"
              />
              <IconButton
                icon={<DeleteIcon />}
                colorScheme="red"
                onClick={deleteTransaction}
                aria-label="Eliminar"
              />
            </>
          )}
          <IconButton
            icon={<DownloadIcon />}
            colorScheme="green"
            onClick={generateReceipt}
            aria-label="Generar recibo"
          />
          <IconButton
            icon={<PrintIcon />}
            variant="outline"
            onClick={() => window.print()}
            aria-label="Imprimir"
          />
        </HStack>
      </Flex>
      
      {/* Información principal */}
      <Card mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">Información de la operación</Heading>
            <HStack>
              {renderTypeBadge(transaction.type)}
              {renderStatusBadge(transaction.status)}
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody>
          <Stack divider={<StackDivider />} spacing={4}>
            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              <GridItem>
                <Stat>
                  <StatLabel>Cliente</StatLabel>
                  <StatNumber fontSize="lg">{transaction.client}</StatNumber>
                </Stat>
              </GridItem>
              
              <GridItem>
                <Stat>
                  <StatLabel>Monto</StatLabel>
                  <StatNumber fontSize="lg">${transaction.amount.toFixed(2)}</StatNumber>
                </Stat>
              </GridItem>
              
              <GridItem>
                <Stat>
                  <StatLabel>Tasa</StatLabel>
                  <StatNumber fontSize="lg">{transaction.rate.toFixed(2)}</StatNumber>
                </Stat>
              </GridItem>
            </Grid>
            
            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              <GridItem>
                <Stat>
                  <StatLabel>Fecha</StatLabel>
                  <StatNumber fontSize="lg">
                    {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </StatNumber>
                </Stat>
              </GridItem>
              
              <GridItem>
                <Stat>
                  <StatLabel>Operador</StatLabel>
                  <StatNumber fontSize="lg">{transaction.operatorName}</StatNumber>
                </Stat>
              </GridItem>
              
              <GridItem>
                <Stat>
                  <StatLabel>ID de Operación</StatLabel>
                  <StatNumber fontSize="lg" fontFamily="mono">{transaction._id}</StatNumber>
                </Stat>
              </GridItem>
            </Grid>
            
            {transaction.description && (
              <Box>
                <Text fontWeight="bold" mb={2}>Descripción:</Text>
                <Text>{transaction.description}</Text>
              </Box>
            )}
          </Stack>
        </CardBody>
      </Card>
      
      {/* Sección de notas */}
      <Box mt={8}>
        <Divider mb={6} />
        <NotesList 
          operationId={transaction._id} 
          operationType={transaction.type}
        />
      </Box>
      
      {/* Modal de edición */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Operación</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Cliente</FormLabel>
                <Input
                  name="client"
                  value={editForm.client}
                  onChange={handleFormChange}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Monto</FormLabel>
                <Input
                  name="amount"
                  type="number"
                  value={editForm.amount}
                  onChange={handleFormChange}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Tasa</FormLabel>
                <Input
                  name="rate"
                  type="number"
                  value={editForm.rate}
                  onChange={handleFormChange}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Estado</FormLabel>
                <Select
                  name="status"
                  value={editForm.status}
                  onChange={handleFormChange}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleFormChange}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={updateTransaction}
              isLoading={formSubmitting}
            >
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default TransactionDetail; 