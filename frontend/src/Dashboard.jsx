import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { Navigate } from 'react-router-dom'
import Settings from './Settings'
import StripePayment from './StripePayment'
import NotificationSettings from './NotificationSettings'

const API_URL = 'http://localhost:3000'

export default function Dashboard() {
  const { user, logout, token } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState(null)
  const [message, setMessage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Cargar pagos desde la API con autenticación
  const fetchPayments = async () => {
    try {
      const url = filter === 'all' 
        ? `${API_URL}/api/payments`
        : `${API_URL}/api/payments?status=${filter}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.status === 401 || response.status === 403) {
        logout()
        return
      }
      
      const data = await response.json()
      
      setPayments(data.payments || [])
      setStats(data.stats || null)
      setLoading(false)
    } catch (error) {
      console.error('Error cargando pagos:', error)
      setLoading(false)
      showMessage('Error de conexión con el backend', 'error')
    }
  }

  // Reintentar pago manualmente
  const handleRetry = async (paymentId) => {
    setRetryingId(paymentId)
    
    try {
      const response = await fetch(`${API_URL}/api/payments/${paymentId}/retry`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.result && data.result.success) {
        showMessage('✅ Pago recuperado exitosamente!', 'success')
      } else {
        const retries = data.result.retries || 0
        showMessage(`⏳ Reintento ${retries} realizado. Verificando...`, 'info')
      }
      
      fetchPayments()
    } catch (error) {
      showMessage('❌ Error procesando reintento', 'error')
    } finally {
      setRetryingId(null)
    }
  }

  // Mostrar mensajes temporales
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  // Exportar a CSV
  const handleExportCSV = () => {
    const filtered = getFilteredPayments()
    
    const headers = ['ID', 'Email', 'Producto', 'Monto', 'Estado', 'Reintentos', 'Fecha']
    const rows = filtered.map(p => [
      p.id,
      p.email,
      p.product,
      `$${p.amount}`,
      p.status,
      p.retries,
      new Date(p.created_at * 1000).toLocaleDateString()
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    showMessage('📥 CSV exportado exitosamente', 'success')
  }

  // Crear pago de prueba
  const handleCreateTestPayment = async () => {
    try {
      const response = await fetch(`${API_URL}/seed-test-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('✅ Pago de prueba creado exitosamente', 'success')
        fetchPayments()
      } else {
        showMessage('❌ Error creando pago de prueba', 'error')
      }
    } catch (error) {
      showMessage('❌ Error de conexión', 'error')
    }
  }

  // Filtrar pagos por búsqueda
  const getFilteredPayments = () => {
    return payments.filter(p => {
      const matchesSearch = searchTerm === '' || 
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }

  useEffect(() => {
    fetchPayments()
    const interval = setInterval(fetchPayments, 10000)
    return () => clearInterval(interval)
  }, [filter, token])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                💰 Whop Retry
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">| {user.company_name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {darkMode ? '🌞' : '🌙'}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <StatCard 
              title="Total Pagos" 
              value={stats.total} 
              icon="📊" 
              color="bg-blue-500"
            />
            <StatCard 
              title="Pendientes" 
              value={stats.pending} 
              icon="⏳" 
              color="bg-yellow-500"
            />
            <StatCard 
              title="Recuperados" 
              value={stats.recovered} 
              icon="✅" 
              color="bg-green-500"
            />
            <StatCard 
              title="Fallidos" 
              value={stats.failed} 
              icon="❌" 
              color="bg-red-500"
            />
            <StatCard 
              title="$ Recuperado" 
              value={`$${stats.totalRecovered.toFixed(2)}`} 
              icon="💰" 
              color="bg-purple-500"
            />
          </div>
        )}

        {/* Distribution Chart */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-8 transition-colors duration-200">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Distribución de Pagos</h3>
            <div className="flex gap-4 h-64">
              <ChartBar label="Pendientes" value={stats.pending} total={stats.total} color="bg-yellow-500" />
              <ChartBar label="Recuperados" value={stats.recovered} total={stats.total} color="bg-green-500" />
              <ChartBar label="Fallidos" value={stats.failed} total={stats.total} color="bg-red-500" />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6 transition-colors duration-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                Todos
              </FilterButton>
              <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
                Pendientes
              </FilterButton>
              <FilterButton active={filter === 'recovered'} onClick={() => setFilter('recovered')}>
                Recuperados
              </FilterButton>
              <FilterButton active={filter === 'failed-permanent'} onClick={() => setFilter('failed-permanent')}>
                Fallidos
              </FilterButton>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="🔍 Buscar por email, producto o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 md:w-80 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
              <button
                onClick={handleCreateTestPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                title="Crear pago de prueba"
              >
                🧪 Test
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                📥 CSV
              </button>
              <button
                onClick={() => setShowNotifications(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Configurar notificaciones"
              >
                📧
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden transition-colors duration-200">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reintentos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Cargando pagos...
                  </td>
                </tr>
              ) : getFilteredPayments().length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No se encontraron pagos que coincidan con la búsqueda' : 'No hay pagos registrados'}
                  </td>
                </tr>
              ) : (
                getFilteredPayments().map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{payment.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{payment.product}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">${payment.amount}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{payment.retries}/3</td>
                    <td className="px-6 py-4 text-sm">
                      {payment.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRetry(payment.id)}
                            disabled={retryingId === payment.id}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
                          >
                            {retryingId === payment.id ? '⏳ Procesando...' : '🔄 Reintentar'}
                          </button>
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            💳 Stripe
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)}
          token={token}
        />
      )}

      {/* Notification Settings Modal */}
      {showNotifications && (
        <NotificationSettings
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Stripe Payment Modal */}
      {selectedPayment && (
        <StripePayment
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={() => {
            setSelectedPayment(null)
            fetchPayments()
            setMessage({ type: 'success', text: '✅ Pago procesado con Stripe exitosamente' })
          }}
        />
      )}
    </div>
  )
}

// Componentes auxiliares
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function ChartBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full flex-1 flex flex-col justify-end">
        <div 
          className={`${color} rounded-t-lg transition-all duration-500`}
          style={{ height: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500">{percentage.toFixed(1)}%</div>
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-purple-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    recovered: 'bg-green-100 text-green-800',
    'failed-permanent': 'bg-red-100 text-red-800'
  }

  const labels = {
    pending: '⏳ Pendiente',
    recovered: '✅ Recuperado',
    'failed-permanent': '❌ Fallido'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
