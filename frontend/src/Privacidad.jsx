import React from 'react';
import { Link } from 'react-router-dom';

function Privacidad() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Whop Recovery
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
          
          <p className="text-sm text-gray-600 mb-8">Última actualización: 1 de noviembre de 2025</p>

          <div className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introducción</h2>
              <p>En Whop Recovery ("nosotros", "nuestro"), respetamos tu privacidad y nos comprometemos a proteger tus datos personales.</p>
              <p className="mt-2">Esta Política explica qué datos recopilamos, cómo los usamos, cómo los protegemos y tus derechos sobre tus datos.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Información que Recopilamos</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Datos de Registro</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>✉️ <strong>Email</strong> (para login y notificaciones)</li>
                <li>🏢 <strong>Nombre de empresa</strong> (para personalización)</li>
                <li>🔑 <strong>Contraseña</strong> (encriptada, nunca almacenamos en texto plano)</li>
                <li>📅 <strong>Fecha de registro</strong></li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Datos de Integraciones</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>🔐 <strong>API Keys de terceros</strong> (Whop, Stripe, etc.) - Encriptadas con AES-256</li>
                <li>🔗 <strong>IDs de cliente</strong> en plataformas externas</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.3 Datos de Transacciones</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>💳 <strong>ID de transacción</strong> (de Whop/Stripe)</li>
                <li>💰 <strong>Monto del pago</strong></li>
                <li>📧 <strong>Email del cliente final</strong> (para enviar recordatorios)</li>
                <li>📊 <strong>Estado del reintento</strong> (pendiente, recuperado, fallido)</li>
                <li>🕐 <strong>Fechas y hora</strong> de cada intento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Cómo Usamos tus Datos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>✅ Proporcionar el servicio de recuperación de pagos</li>
                <li>✅ Enviar emails de reintento a tus clientes</li>
                <li>✅ Mostrar estadísticas en tu Dashboard</li>
                <li>✅ Procesar tu suscripción y pagos</li>
                <li>📊 Analizar patrones de uso (anonimizado)</li>
                <li>🐛 Detectar y corregir errores</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Con Quién Compartimos tus Datos</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 Proveedores de Servicios</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border-b text-left">Proveedor</th>
                      <th className="px-4 py-2 border-b text-left">Propósito</th>
                      <th className="px-4 py-2 border-b text-left">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border-b"><strong>Stripe</strong></td>
                      <td className="px-4 py-2 border-b">Procesar pagos de suscripciones</td>
                      <td className="px-4 py-2 border-b">UE/EE.UU.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-b"><strong>SendGrid</strong></td>
                      <td className="px-4 py-2 border-b">Enviar emails transaccionales</td>
                      <td className="px-4 py-2 border-b">UE/EE.UU.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-b"><strong>Railway</strong></td>
                      <td className="px-4 py-2 border-b">Hosting del backend</td>
                      <td className="px-4 py-2 border-b">EE.UU.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-b"><strong>Vercel</strong></td>
                      <td className="px-4 py-2 border-b">Hosting del frontend</td>
                      <td className="px-4 py-2 border-b">EE.UU.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-red-700 mt-6 mb-3">NO Compartimos con:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>❌ Empresas de publicidad</li>
                <li>❌ Brokers de datos</li>
                <li>❌ Redes sociales</li>
                <li>❌ Terceros no autorizados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Seguridad de los Datos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>🔐 <strong>Encriptación AES-256</strong> para API keys</li>
                <li>🔒 <strong>HTTPS/TLS</strong> en todas las comunicaciones</li>
                <li>🔑 <strong>Hashing bcrypt</strong> para contraseñas</li>
                <li>🛡️ <strong>JWT tokens</strong> para autenticación</li>
                <li>🚨 <strong>Rate limiting</strong> contra ataques</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Tus Derechos (GDPR)</h2>
              <p>Como usuario en la UE, tienes derecho a:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>📥 <strong>Acceso</strong> - Solicitar copia de todos tus datos</li>
                <li>✏️ <strong>Rectificación</strong> - Corregir datos incorrectos</li>
                <li>🗑️ <strong>Supresión</strong> - "Derecho al olvido" - Eliminar tu cuenta</li>
                <li>📤 <strong>Portabilidad</strong> - Exportar tus datos en formato JSON</li>
                <li>🚫 <strong>Oposición</strong> - Oponerte a procesamiento (ej: marketing)</li>
                <li>⏸️ <strong>Restricción</strong> - Limitar procesamiento temporalmente</li>
                <li>⚖️ <strong>Reclamar</strong> - Presentar queja ante autoridad de protección de datos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Retención de Datos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>♾️ Datos de cuenta - Mientras uses el servicio</li>
                <li>📊 Datos de transacciones - 12 meses</li>
                <li>🗂️ Después de cancelar - 30 días (para reactivación)</li>
                <li>📄 Datos de facturación - 7 años (obligación fiscal)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contacto</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>Para ejercer tus derechos o preguntas sobre privacidad:</p>
                <p className="mt-2">📧 <strong>Email:</strong> <a href="mailto:marcp2001@gmail.com" className="text-purple-600 hover:underline">marcp2001@gmail.com</a></p>
                <p className="mt-2">📬 <strong>Asunto:</strong> "Privacidad - [Tu Solicitud]"</p>
                <p className="mt-2">⏱️ <strong>Respuesta:</strong> 30 días máximo</p>
                <p className="mt-2">📍 <strong>Dirección:</strong> Guirigall, Palma de Mallorca, España</p>
              </div>
            </section>

            <div className="mt-12 p-6 bg-green-50 border-l-4 border-green-600 rounded">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Compromiso de Transparencia</h3>
              <p className="text-gray-700">Nos comprometemos a ser transparentes sobre qué datos usamos, darte control total sobre tu información, y proteger tus datos con la mejor tecnología.</p>
              <p className="mt-2 font-semibold text-gray-900">Tus datos son TUYOS. Nosotros solo somos custodios temporales.</p>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              <p>© 2025 Guirigall. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-purple-600 hover:underline">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

export default Privacidad;
