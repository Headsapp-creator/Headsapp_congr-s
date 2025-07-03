import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/admin';
import { ChakraProvider } from '@chakra-ui/react';
import initialTheme from './theme/theme';
import { useState } from 'react';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthContextProvider } from './contexts/AuthContext.jsx'; // Import AuthContextProvider

export default function Main() {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  return (
    <ChakraProvider theme={currentTheme}>
      <AuthContextProvider> 
        <Routes>
          <Route
            path="admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AuthContextProvider>
    </ChakraProvider>
  );
}
