import { useState, useEffect } from 'react'
import IntegrationsSettings from './components/IntegrationsSettings'

const API_URL = 'http://localhost:3000'

export default function Settings({ onClose, token }) {
  const [activeTab, setActiveTab] = useState('general')
  const [config, setConfig] = useState({
    retry_intervals: '',
    max_retries: '3',
    from_email: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success && data.config) {
        setConfig(data.config)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error cargando configuración:', error)
      showMessage('Error cargando configuración', 'error')
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch(`${API_URL}/api/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('✅ Configuración guardada exitosamente', 'success')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        showMessage('❌ Error guardando configuración', 'error')
      }
    } catch (error) {
      showMessage('❌ Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const parseIntervals = (intervals) => {
    if (!intervals) return []
    return intervals.split(',').map(i => {
      const seconds = parseInt(i)
      if (seconds < 60) return `${seconds}s`
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
      return `${Math.floor(seconds / 3600)}h`
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              ⚙️ Configuración del Sistema
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔧 General
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'integrations'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔌 Integraciones
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tab General */}
          {activeTab === 'general' && (
            <>
              {message && (
                <div className={`mb-4 p-4 rounded-lg ${
                  message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                  'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  Cargando configuración...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Intervalos de Reintento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔄 Intervalos de Reintento (en segundos, separados por comas)
                    </label>
                    <input
                      type="text"
                      value={config.retry_intervals}
                      onChange={(e) => setConfig({ ...config, retry_intervals: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="60,300,900"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parseIntervals(config.retry_intervals).map((interval, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          Reintento {i + 1}: {interval}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Ejemplo: 60,300,900 = 1min, 5min, 15min
                    </p>
                  </div>

                  {/* Máximo de Reintentos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔢 Máximo de Reintentos
                    </label>
                    <select
                      value={config.max_retries}
                      onChange={(e) => setConfig({ ...config, max_retries: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="1">1 reintento</option>
                      <option value="2">2 reintentos</option>
                      <option value="3">3 reintentos</option>
                      <option value="5">5 reintentos</option>
                      <option value="10">10 reintentos</option>
                    </select>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="text-2xl">💡</div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Información</h4>
                        <p className="text-sm text-blue-700">
                          Los cambios en la configuración se aplicarán inmediatamente a todos los pagos pendientes.
                          Los intervalos se calculan desde el último intento fallido.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab Integraciones */}
          {activeTab === 'integrations' && (
            <IntegrationsSettings />
          )}
        </div>

        {/* Footer - solo visible en tab General */}
        {activeTab === 'general' && (
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
