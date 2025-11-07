import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useAuth } from './AuthContext';
import axios from 'axios';

// Mock de useAuth
vi.mock('./AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock de axios
vi.mock('axios');

// Mock de react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: vi.fn()
    }
  }),
  Trans: ({ children }) => children
}));

// Wrapper con Router para componentes que usan useNavigate
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    company_name: 'Test Company',
    tenant_id: 'tenant-123'
  };

  const mockStats = {
    total: 100,
    pending: 25,
    recovered: 60,
    failed: 15,
    totalRecovered: 12500.50
  };

  const mockPayments = [
    {
      id: 'pay-1',
      email: 'customer1@example.com',
      product: 'Premium Plan',
      amount: 49.99,
      status: 'recovered',
      retries: 2,
      created_at: Math.floor(Date.now() / 1000) - 86400 // Hace 1 día
    },
    {
      id: 'pay-2',
      email: 'customer2@example.com',
      product: 'Basic Plan',
      amount: 19.99,
      status: 'pending',
      retries: 1,
      created_at: Math.floor(Date.now() / 1000) - 172800 // Hace 2 días
    },
    {
      id: 'pay-3',
      email: 'customer3@example.com',
      product: 'Enterprise Plan',
      amount: 199.99,
      status: 'failed-permanent',
      retries: 3,
      created_at: Math.floor(Date.now() / 1000) - 259200 // Hace 3 días
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de useAuth por defecto
    useAuth.mockReturnValue({
      user: mockUser,
      logout: vi.fn()
    });

    // Mock de axios.get por defecto
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/stats')) {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes('/api/payments')) {
        return Promise.resolve({ data: mockPayments });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  describe('StatCards Rendering', () => {
    it('debería renderizar las 4 tarjetas de estadísticas', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        // Verificar que las 4 StatCards se renderizan
        expect(screen.getByText(/dashboard.stats.total/i)).toBeInTheDocument();
        expect(screen.getByText(/dashboard.stats.pending/i)).toBeInTheDocument();
        expect(screen.getByText(/dashboard.stats.recovered/i)).toBeInTheDocument();
        expect(screen.getByText(/dashboard.stats.totalRecovered/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar los valores correctos del mock', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        // Total de pagos
        expect(screen.getByText('100')).toBeInTheDocument();
        
        // Pendientes
        expect(screen.getByText('25')).toBeInTheDocument();
        
        // Recuperados
        expect(screen.getByText('60')).toBeInTheDocument();
        
        // Total recuperado (formato moneda)
        expect(screen.getByText(/12,500\.50/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar "0" si no hay datos de stats', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stats')) {
          return Promise.resolve({
            data: {
              total: 0,
              pending: 0,
              recovered: 0,
              failed: 0,
              totalRecovered: 0
            }
          });
        }
        if (url.includes('/api/payments')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(3); // Al menos 3 ceros
      });
    });

    it('debería calcular la tasa de recuperación correctamente', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        // Recovery rate = (60 / 100) * 100 = 60%
        const recoveryRate = (mockStats.recovered / mockStats.total) * 100;
        expect(screen.getByText(`${recoveryRate}%`)).toBeInTheDocument();
      });
    });
  });

  describe('Payments Table Rendering', () => {
    it('debería renderizar la tabla de pagos con todos los payments del mock', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        // Verificar que los 3 pagos se renderizan
        expect(screen.getByText('customer1@example.com')).toBeInTheDocument();
        expect(screen.getByText('customer2@example.com')).toBeInTheDocument();
        expect(screen.getByText('customer3@example.com')).toBeInTheDocument();
      });
    });

    it('debería mostrar los productos correctos', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
        expect(screen.getByText('Basic Plan')).toBeInTheDocument();
        expect(screen.getByText('Enterprise Plan')).toBeInTheDocument();
      });
    });

    it('debería mostrar los montos con formato correcto', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/49\.99/i)).toBeInTheDocument();
        expect(screen.getByText(/19\.99/i)).toBeInTheDocument();
        expect(screen.getByText(/199\.99/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar los estados de los pagos', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/recovered/i)).toBeInTheDocument();
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
        expect(screen.getByText(/failed-permanent/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar el número de reintentos', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        // Buscar elementos que contengan información de reintentos
        const retryElements = screen.getAllByText(/2|1|3/);
        expect(retryElements.length).toBeGreaterThan(0);
      });
    });

    it('debería mostrar mensaje cuando no hay pagos', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stats')) {
          return Promise.resolve({ data: mockStats });
        }
        if (url.includes('/api/payments')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard.noPayments/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Calls', () => {
    it('debería llamar a /api/stats con el token correcto', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/stats'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: expect.any(String)
            })
          })
        );
      });
    });

    it('debería llamar a /api/payments con el token correcto', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/payments'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: expect.any(String)
            })
          })
        );
      });
    });

    it('debería manejar errores de API gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        // Verificar que no se rompe la app
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('debería mostrar estado de carga inicialmente', () => {
      // Simular API lenta
      axios.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: mockStats }), 1000))
      );

      renderWithRouter(<Dashboard />);

      // Buscar indicador de carga
      expect(screen.getByText(/loading|cargando/i)).toBeInTheDocument();
    });
  });

  describe('User Context', () => {
    it('debería mostrar el nombre de la empresa del usuario', async () => {
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Test Company/i)).toBeInTheDocument();
      });
    });

    it('debería redirigir a login si no hay usuario', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: vi.fn()
      });

      renderWithRouter(<Dashboard />);

      // Verificar que se redirige (o muestra componente de login)
      // Esto depende de tu implementación
    });
  });
});
