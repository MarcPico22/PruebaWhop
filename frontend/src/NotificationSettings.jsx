import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { API_URL } from './config'

export default function NotificationSettings({ onClose }) {
  const { token, user } = useAuth()
  const [settings, setSettings] = useState({
    notification_email: '',
    email_on_recovery: true,
    email_on_failure: false,
    daily_summary: false,
    weekly_summary: false,
    alert_threshold: 10,
    send_alerts: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success && data.settings) {
        setSettings(data.settings)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error cargando configuración de notificaciones:', error)
      showMessage('Error cargando configuración', 'error')
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('✅ Configuración de notificaciones guardada', 'success')
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

  const handleToggle = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleEmailChange = (e) => {
    setSettings(prev => ({ ...prev, notification_email: e.target.value }))
  }

  const handleThresholdChange = (e) => {
    setSettings(prev => ({ ...prev, alert_threshold: parseInt(e.target.value) || 0 }))
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                📧 Configuración de Notificaciones
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                {user?.company_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Email de notificación */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📬 Email de notificaciones
            </label>
            <input
              type="email"
              value={settings.notification_email || ''}
              onChange={handleEmailChange}
              placeholder={user?.email || 'email@ejemplo.com'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Si está vacío, se usará el email de la cuenta ({user?.email})
            </p>
          </div>

          {/* Notificaciones de pagos */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🔔 Notificaciones de Pagos
            </h3>
            
            <div className="space-y-3">
              <ToggleSwitch
                label="Email cuando se recupera un pago"
                description="Recibirás un email cada vez que un pago fallido se recupere exitosamente"
                checked={settings.email_on_recovery}
                onChange={() => handleToggle('email_on_recovery')}
              />
              
              <ToggleSwitch
                label="Email cuando falla un pago"
                description="Recibirás un email cada vez que un reintento falle"
                checked={settings.email_on_failure}
                onChange={() => handleToggle('email_on_failure')}
              />
            </div>
          </div>

          {/* Resúmenes periódicos */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Resúmenes Periódicos
            </h3>
            
            <div className="space-y-3">
              <ToggleSwitch
                label="Resumen diario"
                description="Recibe un resumen diario con los pagos recuperados del día"
                checked={settings.daily_summary}
                onChange={() => handleToggle('daily_summary')}
              />
              
              <ToggleSwitch
                label="Resumen semanal"
                description="Recibe un resumen semanal con estadísticas completas"
                checked={settings.weekly_summary}
                onChange={() => handleToggle('weekly_summary')}
              />
            </div>
          </div>

          {/* Alertas */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🚨 Alertas
            </h3>
            
            <ToggleSwitch
              label="Activar alertas"
              description="Recibe alertas cuando el número de pagos pendientes supere el umbral"
              checked={settings.send_alerts}
              onChange={() => handleToggle('send_alerts')}
            />
            
            {settings.send_alerts && (
              <div className="mt-4 pl-12">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Umbral de alerta (número de pagos pendientes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.alert_threshold}
                  onChange={handleThresholdChange}
                  className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recibirás una alerta cuando haya {settings.alert_threshold} o más pagos pendientes
                </p>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente de Toggle Switch
function ToggleSwitch({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          checked ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer" onClick={onChange}>
          {label}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  )
}
