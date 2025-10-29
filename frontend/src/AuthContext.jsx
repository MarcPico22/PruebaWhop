import { createContext, useContext, useState, useEffect } from 'react'
import { API_URL } from './config'

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verificar el token y obtener datos del usuario
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('Token inválido');
          return res.json();
        })
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          // Token inválido, limpiar
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    
    return data;
  };

  const register = async (email, password, company_name) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, company_name })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Error al registrar');
    }

    // Después de registrar, hacer login automático
    return login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
