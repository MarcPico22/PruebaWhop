import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { Navigate, useNavigate } from 'react-router-dom'
import Settings from './Settings'
import StripePayment from './StripePayment'
import NotificationSettings from './NotificationSettings'
import SentryTestButton from './SentryTestButton'
import StripeTestButton from './StripeTestButton'
import OnboardingModal from './OnboardingModal'
import BadgeDisplay from './BadgeDisplay'
import LanguageSelector from './LanguageSelector'
import { API_URL } from './config'
import { useTranslation } from 'react-i18next'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, logout, token } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState(null)
  const [message, setMessage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

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

  // Cargar información de suscripción
  const fetchSubscription = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Error cargando suscripción:', error)
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

  // Abrir Customer Portal de Stripe
  const handleManageSubscription = async () => {
    try {
      const response = await fetch(`${API_URL}/api/create-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.url) {
        // Redirigir al Customer Portal de Stripe
        window.location.href = data.url
      } else {
        showMessage('❌ Error abriendo portal de gestión', 'error')
      }
    } catch (error) {
      console.error('Error abriendo portal:', error)
      showMessage('❌ Error de conexión', 'error')
    }
  }

  useEffect(() => {
    fetchPayments()
    fetchSubscription()
    const interval = setInterval(fetchPayments, 10000)
    return () => clearInterval(interval)
  }, [filter, token])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Onboarding Modal */}
      <OnboardingModal 
        manualOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onOpenSettings={() => {
          setShowOnboarding(false);
          setShowSettings(true);
        }}
        onComplete={() => {
          setShowOnboarding(false);
          console.log('Onboarding completado!');
        }} 
      />
      
      {/* Botón de Ayuda Flotante */}
      <button
        onClick={() => setShowOnboarding(true)}
        className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        title="Guía de uso"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm bg-gray-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          ¿Necesitas ayuda?
        </span>
      </button>
      
      {/* Navbar - Mobile Optimized */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo + Company */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                💰 <span className="hidden xs:inline">Whop Recovery</span><span className="xs:hidden">WR</span>
              </h1>
              {user.company_name && (
                <span className="hidden sm:inline text-sm font-medium text-gray-600 dark:text-gray-400 border-l pl-3 truncate">
                  {user.company_name}
                </span>
              )}
              {subscription && (
                <span className={`hidden md:inline px-2.5 py-1 text-xs font-semibold rounded-full ${
                  subscription.plan === 'free' 
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
                    : subscription.plan === 'pro'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-orange-300'
                }`}>
                  {subscription.plan === 'free' && '🆓 FREE'}
                  {subscription.plan === 'pro' && '💎 PRO'}
                  {subscription.plan === 'enterprise' && '👑 ENTERPRISE'}
                </span>
              )}
            </div>
            
            {/* Actions - Mobile Optimized */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <LanguageSelector />
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
                title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {darkMode ? '🌞' : '🌙'}
              </button>
              <a
                href="/pricing"
                className="hidden sm:inline-block px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                💎 Planes
              </a>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95"
              >
                <span className="hidden sm:inline">Cerrar sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Subscription Limit Banner */}
      {subscription && (
        <>
          {/* Warning Banner (80%+) */}
          {(subscription.usagePercentage || 0) >= 80 && (subscription.usagePercentage || 0) < 100 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                        Acercándose al límite del plan {subscription.plan.toUpperCase()}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Has usado {subscription.paymentsUsed} de {subscription.paymentsLimit} pagos ({(subscription.usagePercentage || 0).toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                  <a
                    href="/pricing"
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Actualizar Plan
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Limit Reached Banner (100%) */}
          {(subscription.usagePercentage || 0) >= 100 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🚫</span>
                    <div>
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Límite de pagos alcanzado
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        No puedes procesar más pagos este mes. Actualiza tu plan para continuar.
                      </p>
                    </div>
                  </div>
                  <a
                    href="/pricing"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Actualizar Ahora
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Trial Info Banner */}
          {subscription.status === 'trialing' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Trial gratuito activo
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {subscription.trialDaysLeft} días restantes · 
                        Usando {subscription.paymentsUsed} de {subscription.paymentsLimit} pagos
                      </p>
                    </div>
                  </div>
                  <a
                    href="/pricing"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Ver Planes
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}

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

        {/* Plan Info Card */}
        {subscription && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">
                  {subscription.plan === 'free' && '🆓'}
                  {subscription.plan === 'pro' && '💎'}
                  {subscription.plan === 'enterprise' && '👑'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Plan {subscription.planName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {subscription.paymentsUsed} / {subscription.paymentsLimit === 999999 ? '∞' : subscription.paymentsLimit} pagos usados este mes
                    {subscription.status === 'trialing' && ` · ${subscription.trialDaysLeft} días de trial`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {subscription.plan !== 'enterprise' && (
                  <a
                    href="/pricing"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Mejorar Plan
                  </a>
                )}
                {subscription.stripeCustomerId && (
                  <button
                    onClick={handleManageSubscription}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Gestionar Suscripción
                  </button>
                )}
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Uso del mes</span>
                <span>{(subscription.usagePercentage || 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (subscription.usagePercentage || 0) >= 100 
                      ? 'bg-red-500' 
                      : (subscription.usagePercentage || 0) >= 80 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(subscription.usagePercentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Stats - Mobile Optimized Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <StatCard 
              title={t('dashboard.stats.totalPayments')}
              value={stats.total} 
              icon="📊" 
              color="bg-blue-500"
            />
            <StatCard 
              title={t('dashboard.stats.pending')}
              value={stats.pending} 
              icon="⏳" 
              color="bg-yellow-500"
            />
            <StatCard 
              title={t('dashboard.stats.recovered')}
              value={stats.recovered} 
              icon="✅" 
              color="bg-green-500"
            />
            <StatCard 
              title={t('dashboard.stats.failed')}
              value={stats.failed} 
              icon="❌" 
              color="bg-red-500"
            />
            <StatCard 
              title={`💰 ${t('dashboard.stats.recovered')}`}
              value={`$${stats.totalRecovered.toFixed(2)}`} 
              icon="💰" 
              color="bg-purple-500"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        )}

        {/* Badges Section */}
        <div className="mb-6 sm:mb-8">
          <BadgeDisplay />
        </div>

        {/* Distribution Chart - Mobile Optimized */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-3 sm:p-6 mb-6 sm:mb-8 transition-colors duration-200">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('dashboard.chart.title')}</h3>
            <div className="flex gap-2 sm:gap-4 h-48 sm:h-64">
              <ChartBar label={t('dashboard.stats.pending')} value={stats.pending} total={stats.total} color="bg-yellow-500" />
              <ChartBar label={t('dashboard.stats.recovered')} value={stats.recovered} total={stats.total} color="bg-green-500" />
              <ChartBar label={t('dashboard.stats.failed')} value={stats.failed} total={stats.total} color="bg-red-500" />
            </div>
          </div>
        )}

        {/* Toolbar - Mobile Optimized */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-3 sm:p-6 mb-6 transition-colors duration-200">
          {/* Búsqueda - Full width en mobile */}
          <div className="mb-3 sm:mb-4">
            <input
              type="text"
              placeholder={`🔍 ${t('dashboard.search')}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
            {/* Filtros - Scroll horizontal en mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                {t('dashboard.filters.all')}
              </FilterButton>
              <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
                {t('dashboard.filters.pending')}
              </FilterButton>
              <FilterButton active={filter === 'recovered'} onClick={() => setFilter('recovered')}>
                {t('dashboard.filters.recovered')}
              </FilterButton>
              <FilterButton active={filter === 'failed-permanent'} onClick={() => setFilter('failed-permanent')}>
                {t('dashboard.filters.failed')}
              </FilterButton>
            </div>

            {/* Acciones - Grid en mobile */}
            <div className="grid grid-cols-3 sm:flex gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm sm:text-base whitespace-nowrap"
                title="Exportar CSV"
              >
                <span className="hidden sm:inline">📥 CSV</span>
                <span className="sm:hidden">📥</span>
              </button>
              <button
                onClick={() => setShowNotifications(true)}
                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all text-sm sm:text-base"
                title="Notificaciones"
              >
                📧
              </button>
              {user.email === 'marcps2001@gmail.com' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-3 sm:px-4 py-2.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-all text-sm sm:text-base font-semibold shadow-lg"
                  title="Panel de Administración"
                >
                  👑 Admin
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:scale-95 transition-all text-sm sm:text-base"
                title="Configuración"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table/Cards - Responsive */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden transition-colors duration-200">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.table.email')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.table.product')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.table.amount')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.table.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.table.retries')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {t('dashboard.loadingPayments')}
                    </td>
                  </tr>
                ) : getFilteredPayments().length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? t('dashboard.noSearchResults') : t('dashboard.noPayments')}
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
                              {retryingId === payment.id ? t('dashboard.actions.processing') : t('dashboard.actions.retry')}
                            </button>
                            <button
                              onClick={() => setSelectedPayment(payment)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              {t('dashboard.actions.viewDetails')}
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

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                Cargando pagos...
              </div>
            ) : getFilteredPayments().length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No se encontraron pagos' : 'No hay pagos registrados'}
              </div>
            ) : (
              getFilteredPayments().map((payment) => (
                <div key={payment.id} className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {payment.email}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                        {payment.product}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>
                  
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Monto:</span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">
                        ${payment.amount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Reintentos:</span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">
                        {payment.retries}/3
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {payment.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleRetry(payment.id)}
                        disabled={retryingId === payment.id}
                        className="flex-1 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 active:scale-95 transition"
                      >
                        {retryingId === payment.id ? '⏳ Procesando...' : '🔄 Reintentar'}
                      </button>
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition"
                      >
                        💳 Stripe
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
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

      {/* Sentry Test Button (solo en desarrollo) */}
      <SentryTestButton />
      
      {/* Stripe Test Button (solo en desarrollo) */}
      <StripeTestButton />
    </div>
  )
}

// Componentes auxiliares
function StatCard({ title, value, icon, color, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
        </div>
        <div className={`${color} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 ml-2`}>
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
      <div className="mt-1 sm:mt-2 text-center">
        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{value}</div>
        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate px-1">{label}</div>
        <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">{percentage.toFixed(1)}%</div>
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
  const { t } = useTranslation();
  
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    recovered: 'bg-green-100 text-green-800',
    'failed-permanent': 'bg-red-100 text-red-800'
  }

  const labels = {
    pending: t('dashboard.status.pending'),
    recovered: t('dashboard.status.recovered'),
    'failed-permanent': t('dashboard.status.failed')
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
