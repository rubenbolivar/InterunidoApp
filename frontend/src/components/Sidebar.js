import React from 'react';
import {
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  BoxProps,
  FlexProps,
  Button,
  VStack,
  HStack,
  Divider,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
} from '@chakra-ui/react';
import {
  FiMenu,
  FiChevronDown,
} from 'react-icons/fi';
import {
  MdDashboard,
  MdSwapHoriz,
  MdPerson,
  MdGroup,
  MdInsertChart,
  MdSettings,
  MdLogout,
  MdNoteAdd,
} from 'react-icons/md';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const SidebarContent = ({ onClose, ...rest }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Definir elementos de navegación
  const navItems = [
    { name: 'Dashboard', icon: MdDashboard, path: '/dashboard' },
    { name: 'Operaciones', icon: MdSwapHoriz, path: '/transactions' },
    { name: 'Notas', icon: MdNoteAdd, path: '/notes' },
    { name: 'Perfil', icon: MdPerson, path: '/profile' },
  ];
  
  // Elementos solo para administradores
  const adminItems = [
    { name: 'Usuarios', icon: MdGroup, path: '/users' },
    { name: 'Reportes', icon: MdInsertChart, path: '/reports' },
    { name: 'Configuración', icon: MdSettings, path: '/settings' },
  ];
  
  // Combinar elementos según el rol del usuario
  const items = user?.role === 'admin' 
    ? [...navItems, ...adminItems] 
    : navItems;
  
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Logo />
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      
      <VStack spacing={1} align="stretch" px={3}>
        {items.map((item) => (
          <NavItem 
            key={item.name} 
            icon={item.icon} 
            path={item.path}
            isActive={location.pathname === item.path}
          >
            {item.name}
          </NavItem>
        ))}
      </VStack>
    </Box>
  );
};

const NavItem = ({ icon, children, path, isActive, ...rest }) => {
  return (
    <Link to={path} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'blue.400' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{
          bg: isActive ? 'blue.500' : 'blue.50',
          color: isActive ? 'white' : 'blue.500',
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

const MobileNav = ({ onOpen, ...rest }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />
      
      <Logo display={{ base: 'flex', md: 'none' }} />
      
      <HStack spacing={{ base: '0', md: '6' }}>
        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: 'none' }}
            >
              <HStack>
                <Avatar
                  size={'sm'}
                  name={user?.username || 'Usuario'}
                />
                <VStack
                  display={{ base: 'none', md: 'flex' }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="sm">{user?.username || 'Usuario'}</Text>
                  <Text fontSize="xs" color="gray.600">
                    {user?.role === 'admin' ? 'Administrador' : 'Operador'}
                  </Text>
                </VStack>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <MenuItem as={Link} to="/profile">Perfil</MenuItem>
              <MenuItem as={Link} to="/settings">Configuración</MenuItem>
              <MenuDivider />
              <MenuItem onClick={handleLogout} icon={<MdLogout />}>Cerrar sesión</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};

const Sidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <SidebarContent
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {/* Contenido de la página */}
      </Box>
    </Box>
  );
};

export default Sidebar; 