import React from 'react';
import { Box, Container, Heading } from '@chakra-ui/react';
import NotesList from '../components/Notes/NotesList';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Notes = () => {
  const { user, loading } = useAuth();
  
  // Redireccionar si no hay usuario autenticado
  if (!loading && !user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6}>
        <Heading size="lg">Gestión de Notas</Heading>
      </Box>
      
      <NotesList />
    </Container>
  );
};

export default Notes; 