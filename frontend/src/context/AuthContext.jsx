import React, { createContext, useContext, useState } from 'react';

const CREDENTIALS = [
  { id: 'emanuel',  name: 'Emanuel',  color: 'green',  email: 'emanuel@uno.com',  senha: 'emanuel123'  },
  { id: 'jacyane',  name: 'Jaciany',  color: 'white',  email: 'jaciany@uno.com',  senha: 'jaciany123'  },
  { id: 'mayara',   name: 'Mayara',   color: 'yellow', email: 'mayara@uno.com',   senha: 'mayara123'   },
  { id: 'renan',    name: 'Renan',    color: 'red',    email: 'renan@uno.com',    senha: 'renan123'    },
  { id: 'stephane', name: 'Stephane', color: 'blue',   email: 'stephane@uno.com', senha: 'stephane123' },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('uno_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  function login(email, senha) {
    const found = CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.senha === senha
    );
    if (!found) return false;
    const { senha: _, ...safeUser } = found;
    setUser(safeUser);
    sessionStorage.setItem('uno_user', JSON.stringify(safeUser));
    return true;
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem('uno_user');
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
