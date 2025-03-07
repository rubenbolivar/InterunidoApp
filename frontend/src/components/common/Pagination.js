import React from 'react';
import { Button, ButtonGroup, Flex, Text } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // No mostrar paginación si solo hay una página
  if (totalPages <= 1) {
    return null;
  }

  // Determinar qué botones de página mostrar
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Siempre mostrar la primera página
    pageNumbers.push(1);
    
    // Calcular el rango de páginas a mostrar alrededor de la página actual
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Ajustar para mostrar siempre 3 páginas si es posible
    if (endPage - startPage < 2) {
      if (startPage === 2) {
        endPage = Math.min(totalPages - 1, startPage + 2);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(2, endPage - 2);
      }
    }
    
    // Añadir elipsis después de la primera página si hay un salto
    if (startPage > 2) {
      pageNumbers.push('...');
    }
    
    // Añadir páginas intermedias
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Añadir elipsis antes de la última página si hay un salto
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Siempre mostrar la última página si hay más de una página
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Flex align="center" justify="center">
      <ButtonGroup variant="outline" spacing="2">
        {/* Botón anterior */}
        <Button
          leftIcon={<ChevronLeftIcon />}
          onClick={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage === 1}
          size="sm"
        >
          Anterior
        </Button>
        
        {/* Botones de página */}
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <Text key={`ellipsis-${index}`} mx={2}>...</Text>
          ) : (
            <Button
              key={`page-${page}`}
              onClick={() => onPageChange(page)}
              colorScheme={currentPage === page ? 'blue' : 'gray'}
              variant={currentPage === page ? 'solid' : 'outline'}
              size="sm"
            >
              {page}
            </Button>
          )
        ))}
        
        {/* Botón siguiente */}
        <Button
          rightIcon={<ChevronRightIcon />}
          onClick={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          size="sm"
        >
          Siguiente
        </Button>
      </ButtonGroup>
    </Flex>
  );
};

export default Pagination; 