import React from 'react';
import { Link } from 'react-router-dom';

function Terminos() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos de Servicio</h1>
          
          <p className="text-sm text-gray-600 mb-8">Última actualización: 1 de noviembre de 2025</p>

          <div className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Aceptación de los Términos</h2>
              <p>Al registrarse y usar Whop Recovery ("el Servicio"), usted acepta estar legalmente vinculado por estos Términos de Servicio. Si no está de acuerdo, no utilice el Servicio.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Descripción del Servicio</h2>
              <p>Whop Recovery es una plataforma SaaS que ayuda a recuperar pagos fallidos mediante:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Monitoreo automático de transacciones fallidas</li>
                <li>Reintentos automáticos programados</li>
                <li>Notificaciones por email personalizadas</li>
                <li>Integración con plataformas de pago (Whop, Stripe, etc.)</li>
                <li>Dashboard de análisis y estadísticas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Planes y Facturación</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Planes Disponibles</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>FREE:</strong> Hasta 50 pagos recuperados/mes - Trial de 14 días</li>
                <li><strong>PRO:</strong> Hasta 500 pagos recuperados/mes - €49/mes o €499/año</li>
                <li><strong>ENTERPRISE:</strong> Pagos ilimitados - €199/mes o €2,099/año</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2 Pago</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Los pagos se procesan mediante Stripe</li>
                <li>Las suscripciones se renuevan automáticamente</li>
                <li>Puedes cancelar en cualquier momento desde tu Dashboard</li>
                <li>No hay reembolsos por periodos parciales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Uso Aceptable</h2>
              
              <h3 className="text-xl font-semibold text-green-700 mt-6 mb-3">Está Permitido:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar el Servicio para recuperar pagos legítimos de tus clientes</li>
                <li>Integrar con tus plataformas de pago autorizadas</li>
                <li>Personalizar mensajes de notificación</li>
                <li>Exportar tus propios datos</li>
              </ul>

              <h3 className="text-xl font-semibold text-red-700 mt-6 mb-3">Está Prohibido:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar el Servicio para spam o fraude</li>
                <li>Compartir tu cuenta con terceros</li>
                <li>Intentar hackear o comprometer la seguridad</li>
                <li>Realizar ingeniería inversa del código</li>
                <li>Revender el Servicio sin autorización</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Privacidad y Datos</h2>
              <p>Ver nuestra <Link to="/privacidad" className="text-purple-600 hover:underline">Política de Privacidad</Link> completa para detalles sobre cómo manejamos tus datos.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Propiedad Intelectual</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Whop Recovery y su código son propiedad de <strong>Guirigall</strong></li>
                <li>Conservas todos los derechos sobre tus datos</li>
                <li>No puedes copiar, modificar o distribuir nuestro software</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Limitación de Responsabilidad</h2>
              <p className="font-semibold">EN NINGÚN CASO SEREMOS RESPONSABLES POR:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Pérdida de ingresos o beneficios</li>
                <li>Daños indirectos o consecuenciales</li>
                <li>Pérdida de datos (realiza tus propios backups)</li>
                <li>Fallos de terceros (Stripe, Whop, SendGrid, etc.)</li>
              </ul>
              <p className="mt-4"><strong>RESPONSABILIDAD MÁXIMA:</strong> El importe pagado en los últimos 3 meses.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Ley Aplicable</h2>
              <p>Estos Términos se rigen por las leyes de <strong>España</strong>.</p>
              <p className="mt-2">Cualquier disputa se resolverá en los tribunales de <strong>Palma de Mallorca</strong>.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contacto</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>📧 <strong>Email:</strong> <a href="mailto:marcp2001@gmail.com" className="text-purple-600 hover:underline">marcp2001@gmail.com</a></p>
                <p className="mt-2">🌐 <strong>Web:</strong> <a href="https://www.whoprecovery.com" className="text-purple-600 hover:underline">whoprecovery.com</a></p>
                <p className="mt-2">📍 <strong>Dirección:</strong> Guirigall, Palma de Mallorca, España</p>
              </div>
            </section>

            <div className="mt-12 p-6 bg-purple-50 border-l-4 border-purple-600 rounded">
              <p className="font-semibold text-gray-900">
                Al hacer clic en "Registrarse" o usar el Servicio, confirmas que has leído, entendido y aceptado estos Términos de Servicio.
              </p>
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

export default Terminos;
