import React, { createContext, useContext, useState } from 'react';

export const PROFILES = [
  { id: 'emanuel',  name: 'Emanuel',  color: 'green'  },
  { id: 'jacyane',  name: 'Jaciany',  color: 'white'  },
  { id: 'mayara',   name: 'Mayara',   color: 'yellow' },
  { id: 'renan',    name: 'Renan',    color: 'red'    },
  { id: 'stephane', name: 'Stephane', color: 'blue'   },
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

  function escolherPerfil(profile) {
    setUser(profile);
    sessionStorage.setItem('uno_user', JSON.stringify(profile));
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem('uno_user');
  }

  return (
    <AuthContext.Provider value={{ user, escolherPerfil, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
