import React from 'react';
import { Box } from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Redireccionar si no hay usuario autenticado
  if (!loading && !user) {
    return <Navigate to="/login" />;
  }
  
  // Mostrar un contenedor vacío mientras se carga
  if (loading) {
    return <Box />;
  }
  
  return (
    <Sidebar>
      <Box ml={{ base: 0, md: 60 }} p={4}>
        {children}
      </Box>
    </Sidebar>
  );
};

export default Layout; 