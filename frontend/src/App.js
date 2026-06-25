import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import EscolherPerfil from './pages/EscolherPerfil';
import Perfil from './pages/Perfil';
import Jogo from './pages/Jogo';
import Mesa from './pages/Mesa';

function RotaProtegida({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/entrar" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/entrar" element={<EscolherPerfil />} />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <Home />
          </RotaProtegida>
        }
      />
      <Route
        path="/perfil"
        element={
          <RotaProtegida>
            <Perfil />
          </RotaProtegida>
        }
      />
      <Route
        path="/jogo"
        element={
          <RotaProtegida>
            <Jogo />
          </RotaProtegida>
        }
      />
      <Route
        path="/jogo/:codigo"
        element={
          <RotaProtegida>
            <Mesa />
          </RotaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;