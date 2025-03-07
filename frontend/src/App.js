import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import CreateTransaction from './pages/CreateTransaction';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Notes from './pages/Notes';

function App() {
  return (
    <AuthProvider>
      <ChakraProvider theme={theme}>
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
            <Route path="/transactions/:id" element={<Layout><TransactionDetail /></Layout>} />
            <Route path="/transactions/create" element={<Layout><CreateTransaction /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/users" element={<Layout><Users /></Layout>} />
            <Route path="/reports" element={<Layout><Reports /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/notes" element={<Layout><Notes /></Layout>} />
            
            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ChakraProvider>
    </AuthProvider>
  );
}

export default App; 