import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  Flex, 
  Input, 
  Select, 
  IconButton, 
  Badge, 
  useToast, 
  Spinner,
  Stack,
  Divider,
  HStack,
  Tag,
  TagLabel,
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
  Textarea
} from '@chakra-ui/react';
import { 
  AddIcon, 
  SearchIcon, 
  EditIcon, 
  DeleteIcon, 
  CalendarIcon,
  LinkIcon
} from '@chakra-ui/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Pagination from '../common/Pagination';

const NotesList = ({ operationId = null, operationType = null }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();
  
  // Estados para la lista de notas
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    type: operationType || ''
  });
  
  // Estados para el formulario de nota
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    operationType: operationType || 'general',
    operationId: operationId || null
  });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Cargar notas
  const fetchNotes = async (page = 1) => {
    setLoading(true);
    try {
      let url = '/api/notes';
      
      // Si estamos en el contexto de una operación específica
      if (operationId) {
        url = `/api/notes/operation/${operationId}`;
      } else {
        // Construir parámetros de consulta para la lista general
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', pagination.limit);
        
        if (filters.search) params.append('search', filters.search);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.type) params.append('type', filters.type);
        if (operationId) params.append('operationId', operationId);
        
        url = `/api/notes?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      
      if (operationId) {
        // Para notas de una operación específica (sin paginación)
        setNotes(response.data);
        setPagination({
          ...pagination,
          page: 1,
          total: response.data.length,
          pages: 1
        });
      } else {
        // Para la lista general con paginación
        setNotes(response.data.notes);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error al cargar notas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las notas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Efecto para cargar notas al montar el componente o cambiar filtros
  useEffect(() => {
    fetchNotes(pagination.page);
  }, [pagination.page, operationId]);
  
  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };
  
  // Manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };
  
  // Aplicar filtros
  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    fetchNotes(1);
  };
  
  // Resetear filtros
  const resetFilters = () => {
    setFilters({
      search: '',
      dateFrom: '',
      dateTo: '',
      type: operationType || ''
    });
    setPagination({ ...pagination, page: 1 });
    fetchNotes(1);
  };
  
  // Manejar cambios en el formulario de nota
  const handleNoteFormChange = (e) => {
    const { name, value } = e.target;
    setNoteForm({ ...noteForm, [name]: value });
  };
  
  // Abrir modal para crear nota
  const openCreateNoteModal = () => {
    setNoteForm({
      title: '',
      content: '',
      operationType: operationType || 'general',
      operationId: operationId || null
    });
    setEditingNoteId(null);
    onOpen();
  };
  
  // Abrir modal para editar nota
  const openEditNoteModal = (note) => {
    setNoteForm({
      title: note.title,
      content: note.content,
      operationType: note.operationType,
      operationId: note.operationId
    });
    setEditingNoteId(note._id);
    onOpen();
  };
  
  // Guardar nota (crear o actualizar)
  const saveNote = async () => {
    if (!noteForm.title || !noteForm.content) {
      toast({
        title: 'Error',
        description: 'El título y contenido son obligatorios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setFormSubmitting(true);
    
    try {
      let response;
      
      if (editingNoteId) {
        // Actualizar nota existente
        response = await axios.put(`/api/notes/${editingNoteId}`, {
          title: noteForm.title,
          content: noteForm.content
        });
        
        toast({
          title: 'Éxito',
          description: 'Nota actualizada correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Crear nueva nota
        response = await axios.post('/api/notes', noteForm);
        
        toast({
          title: 'Éxito',
          description: 'Nota creada correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Cerrar modal y recargar notas
      onClose();
      fetchNotes(pagination.page);
    } catch (error) {
      console.error('Error al guardar nota:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al guardar la nota',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Archivar nota
  const archiveNote = async (noteId) => {
    if (!window.confirm('¿Está seguro de que desea archivar esta nota?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/notes/${noteId}`);
      
      toast({
        title: 'Éxito',
        description: 'Nota archivada correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Recargar notas
      fetchNotes(pagination.page);
    } catch (error) {
      console.error('Error al archivar nota:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al archivar la nota',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Renderizar etiquetas extraídas del contenido
  const renderTags = (tags) => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <HStack spacing={2} mt={2} flexWrap="wrap">
        {tags.map((tag, index) => (
          <Tag 
            size="sm" 
            key={index} 
            colorScheme="blue" 
            borderRadius="full"
            cursor="pointer"
            onClick={() => {
              setFilters({ ...filters, search: tag });
              applyFilters();
            }}
          >
            <TagLabel>#{tag}</TagLabel>
          </Tag>
        ))}
      </HStack>
    );
  };
  
  // Renderizar tipo de operación
  const renderOperationType = (type) => {
    let color;
    let label;
    
    switch (type) {
      case 'venta':
        color = 'green';
        label = 'Venta';
        break;
      case 'canje':
        color = 'purple';
        label = 'Canje';
        break;
      default:
        color = 'gray';
        label = 'General';
    }
    
    return (
      <Badge colorScheme={color} mr={2}>
        {label}
      </Badge>
    );
  };
  
  return (
    <Box>
      {/* Título y botón de crear */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">
          {operationId ? 'Notas de la operación' : 'Notas'}
        </Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue" 
          size="sm"
          onClick={openCreateNoteModal}
        >
          Nueva nota
        </Button>
      </Flex>
      
      {/* Filtros (solo mostrar en la vista general, no en la vista de operación) */}
      {!operationId && (
        <Box mb={4} p={4} bg="gray.50" borderRadius="md">
          <Flex direction={{ base: 'column', md: 'row' }} gap={3}>
            <FormControl>
              <Flex align="center">
                <Input
                  placeholder="Buscar por título, contenido o etiqueta"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  size="sm"
                />
                <IconButton
                  icon={<SearchIcon />}
                  ml={2}
                  size="sm"
                  onClick={applyFilters}
                  aria-label="Buscar"
                />
              </Flex>
            </FormControl>
            
            <FormControl>
              <Input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                size="sm"
                placeholder="Desde"
              />
            </FormControl>
            
            <FormControl>
              <Input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                size="sm"
                placeholder="Hasta"
              />
            </FormControl>
            
            <FormControl>
              <Select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                size="sm"
                placeholder="Tipo de operación"
              >
                <option value="">Todos</option>
                <option value="general">General</option>
                <option value="venta">Venta</option>
                <option value="canje">Canje</option>
              </Select>
            </FormControl>
            
            <Button size="sm" onClick={applyFilters} colorScheme="blue">
              Filtrar
            </Button>
            
            <Button size="sm" onClick={resetFilters} variant="outline">
              Limpiar
            </Button>
          </Flex>
        </Box>
      )}
      
      {/* Lista de notas */}
      {loading ? (
        <Flex justify="center" align="center" my={8}>
          <Spinner size="xl" />
        </Flex>
      ) : notes.length === 0 ? (
        <Box textAlign="center" my={8} p={4} bg="gray.50" borderRadius="md">
          <Text>No hay notas disponibles</Text>
          <Button 
            mt={4} 
            colorScheme="blue" 
            size="sm" 
            leftIcon={<AddIcon />}
            onClick={openCreateNoteModal}
          >
            Crear primera nota
          </Button>
        </Box>
      ) : (
        <Stack spacing={4} mt={4}>
          {notes.map((note) => (
            <Box 
              key={note._id} 
              p={4} 
              borderWidth="1px" 
              borderRadius="md" 
              shadow="sm"
              _hover={{ shadow: 'md' }}
              transition="all 0.2s"
            >
              <Flex justify="space-between" align="flex-start">
                <Heading size="sm" mb={2}>
                  {note.title}
                </Heading>
                <HStack>
                  {/* Botones de acción */}
                  <IconButton
                    icon={<EditIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => openEditNoteModal(note)}
                    aria-label="Editar"
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => archiveNote(note._id)}
                    aria-label="Archivar"
                  />
                </HStack>
              </Flex>
              
              {/* Metadatos */}
              <Flex fontSize="sm" color="gray.500" mb={2} flexWrap="wrap">
                {renderOperationType(note.operationType)}
                
                <Text mr={2}>
                  <CalendarIcon mr={1} />
                  {format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                </Text>
                
                <Text>
                  Por: {note.createdBy?.username || 'Usuario'}
                </Text>
                
                {note.operationId && !operationId && (
                  <Flex align="center" ml={2}>
                    <LinkIcon mr={1} />
                    <Text>Vinculada a operación</Text>
                  </Flex>
                )}
              </Flex>
              
              {/* Contenido */}
              <Text whiteSpace="pre-wrap" mb={2}>
                {note.content}
              </Text>
              
              {/* Etiquetas */}
              {renderTags(note.tags)}
            </Box>
          ))}
        </Stack>
      )}
      
      {/* Paginación (solo en vista general) */}
      {!operationId && !loading && notes.length > 0 && (
        <Flex justify="center" mt={6}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </Flex>
      )}
      
      {/* Modal para crear/editar nota */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingNoteId ? 'Editar nota' : 'Nueva nota'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Título</FormLabel>
              <Input
                name="title"
                value={noteForm.title}
                onChange={handleNoteFormChange}
                placeholder="Título de la nota"
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>Contenido</FormLabel>
              <Textarea
                name="content"
                value={noteForm.content}
                onChange={handleNoteFormChange}
                placeholder="Contenido de la nota. Usa #etiqueta para añadir etiquetas."
                minH="200px"
              />
            </FormControl>
            
            {!operationId && !editingNoteId && (
              <>
                <FormControl mb={4}>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    name="operationType"
                    value={noteForm.operationType}
                    onChange={handleNoteFormChange}
                  >
                    <option value="general">General</option>
                    <option value="venta">Venta</option>
                    <option value="canje">Canje</option>
                  </Select>
                </FormControl>
                
                <Text fontSize="sm" color="gray.500" mb={4}>
                  Puedes usar #etiqueta en el contenido para añadir etiquetas que faciliten la búsqueda.
                </Text>
              </>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={saveNote}
              isLoading={formSubmitting}
            >
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default NotesList; 