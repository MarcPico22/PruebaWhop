import { useState, useEffect } from 'react'
import Settings from './Settings'

import './index.css'
import { AuthProvider } from './AuthContext'
import { API_URL } from './config'

function App() {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState(null)
  const [message, setMessage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Cargar pagos desde la API
  const fetchPayments = async () => {
    try {
      const url = filter === 'all' 
        ? `${API_URL}/api/payments`
        : `${API_URL}/api/payments?status=${filter}`
      
      const response = await fetch(url)
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
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.result && data.result.success) {
        showMessage('✅ Pago recuperado exitosamente!', 'success')
      } else {
        const retries = data.result.retries || 0
        if (retries >= 3) {
          showMessage('❌ Fallo permanente después de 3 intentos', 'error')
        } else {
          showMessage(`⚠️ Intento fallido (${retries}/3)`, 'warning')
        }
      }
      
      // Recargar lista
      setTimeout(() => fetchPayments(), 1000)
      
    } catch (error) {
      console.error('Error reintentando pago:', error)
      showMessage('❌ Error procesando reintento', 'error')
    } finally {
      setRetryingId(null)
    }
  }

  // Crear pago de prueba
  const handleCreateTest = async () => {
    try {
      const response = await fetch(`${API_URL}/seed-test-payment`, {
        method: 'POST'
      })
      
      if (response.ok) {
        showMessage('✅ Pago de prueba creado', 'success')
        setTimeout(() => fetchPayments(), 500)
      }
    } catch (error) {
      showMessage('❌ Error creando pago de prueba', 'error')
    }
  }

  // Exportar pagos a CSV
  const handleExportCSV = () => {
    if (payments.length === 0) {
      showMessage('⚠️ No hay pagos para exportar', 'warning')
      return
    }

    // Filtrar pagos según búsqueda
    const filteredPayments = getFilteredPayments()

    // Crear CSV
    const headers = ['ID', 'Email', 'Producto', 'Monto', 'Estado', 'Intentos', 'Creado', 'Último Intento']
    const rows = filteredPayments.map(p => [
      p.id,
      p.email,
      p.product,
      p.amount,
      p.status,
      `${p.retries}/3`,
      new Date(p.created_at * 1000).toLocaleString('es-ES'),
      p.last_attempt ? new Date(p.last_attempt * 1000).toLocaleString('es-ES') : 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `whop-retry-payments-${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showMessage('✅ CSV exportado exitosamente', 'success')
  }

  // Filtrar pagos por búsqueda
  const getFilteredPayments = () => {
    if (!searchTerm) return payments
    
    const term = searchTerm.toLowerCase()
    return payments.filter(p => 
      p.email.toLowerCase().includes(term) ||
      p.product.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    )
  }

  // Mostrar mensaje temporal
  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  useEffect(() => {
    fetchPayments()
    // Auto-refresh cada 10 segundos
    const interval = setInterval(fetchPayments, 10000)
    return () => clearInterval(interval)
  }, [filter])

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('es-ES')
  }

  // Obtener clase CSS por estado
  const getStatusClass = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'recovered': return 'bg-green-100 text-green-800'
      case 'failed-permanent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Obtener texto por estado
  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return '⏳ Pendiente'
      case 'recovered': return '✅ Recuperado'
      case 'failed-permanent': return '❌ Fallido'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">⏳ Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💳 Whop Retry
              </h1>
              <p className="text-gray-600 mt-1">Dashboard de recuperación de pagos</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                ⚙️ Configuración
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                📥 Exportar CSV
              </button>
              <button
                onClick={handleCreateTest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                + Crear pago de prueba
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mensaje temporal */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' :
            message.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">Total pagos</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200">
              <div className="text-sm text-yellow-800">Pendientes</div>
              <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
            </div>
            <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-200">
              <div className="text-sm text-green-800">Recuperados</div>
              <div className="text-3xl font-bold text-green-900 mt-2">{stats.recovered}</div>
            </div>
            <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
              <div className="text-sm text-red-800">Fallidos</div>
              <div className="text-3xl font-bold text-red-900 mt-2">{stats.failed}</div>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="text-sm text-blue-800">Monto recuperado</div>
              <div className="text-3xl font-bold text-blue-900 mt-2">
                ${stats.totalRecovered.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Gráfico de Distribución */}
        {stats && stats.total > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Distribución de Pagos</h3>
            <div className="flex items-end gap-4 h-48">
              {/* Barra Pendientes */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '100%' }}>
                  <div 
                    className="bg-yellow-500 w-full transition-all duration-500 flex items-end justify-center pb-2"
                    style={{ height: `${(stats.pending / stats.total) * 100}%`, minHeight: stats.pending > 0 ? '30px' : '0' }}
                  >
                    {stats.pending > 0 && <span className="text-white font-bold text-sm">{stats.pending}</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 font-medium">Pendientes</div>
                <div className="text-xs text-gray-500">{stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0}%</div>
              </div>

              {/* Barra Recuperados */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '100%' }}>
                  <div 
                    className="bg-green-500 w-full transition-all duration-500 flex items-end justify-center pb-2"
                    style={{ height: `${(stats.recovered / stats.total) * 100}%`, minHeight: stats.recovered > 0 ? '30px' : '0' }}
                  >
                    {stats.recovered > 0 && <span className="text-white font-bold text-sm">{stats.recovered}</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 font-medium">Recuperados</div>
                <div className="text-xs text-gray-500">{stats.total > 0 ? ((stats.recovered / stats.total) * 100).toFixed(1) : 0}%</div>
              </div>

              {/* Barra Fallidos */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '100%' }}>
                  <div 
                    className="bg-red-500 w-full transition-all duration-500 flex items-end justify-center pb-2"
                    style={{ height: `${(stats.failed / stats.total) * 100}%`, minHeight: stats.failed > 0 ? '30px' : '0' }}
                  >
                    {stats.failed > 0 && <span className="text-white font-bold text-sm">{stats.failed}</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 font-medium">Fallidos</div>
                <div className="text-xs text-gray-500">{stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Búsqueda y Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Buscar por email, producto o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('recovered')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'recovered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recuperados
            </button>
            <button
              onClick={() => setFilter('failed-permanent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'failed-permanent'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fallidos
            </button>
          </div>
        </div>

        {/* Tabla de pagos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {getFilteredPayments().length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchTerm ? 'No se encontraron pagos con ese criterio' : 'No hay pagos para mostrar'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último intento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredPayments().map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.retries}/3
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.last_attempt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRetry(payment.id)}
                              disabled={retryingId === payment.id}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              {retryingId === payment.id ? '⏳' : '🔄'} Retry
                            </button>
                            <a
                              href={payment.retry_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              🔗
                            </a>
                          </div>
                        )}
                        {payment.status === 'recovered' && (
                          <span className="text-green-600 font-medium">✅ Completado</span>
                        )}
                        {payment.status === 'failed-permanent' && (
                          <span className="text-red-600 font-medium">❌ Fallo final</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Los pagos se reintentan automáticamente cada 1min, 5min y 15min</p>
          <p className="mt-1">Auto-refresh cada 10 segundos</p>
        </div>
      </div>

      {/* Modal de Configuración */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
