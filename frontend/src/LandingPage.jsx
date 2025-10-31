import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Whop Recovery</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/pricing"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Precios
              </Link>
              <Link
                to="/faq"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                FAQ
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                >
                  Ir al Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Empezar gratis
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6">
            Recupera los pagos que pierdes en Whop
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Miles de euros se pierden cada mes por pagos fallidos. Nosotros los recuperamos automáticamente 
            mientras tú te enfocas en crear contenido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-lg"
            >
              Empezar ahora gratis
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 text-lg font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition"
            >
              Ver cómo funciona
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            14 días de prueba · Sin tarjeta de crédito · Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">85%</div>
              <div className="text-indigo-200">Tasa de recuperación</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">€12K+</div>
              <div className="text-indigo-200">Recuperados este mes</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-indigo-200">Automático</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Tres pasos. Cero complicaciones.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Conecta tu cuenta</h3>
              <p className="text-gray-600">
                Vincula tu Stripe en dos clics. No necesitas código ni configuraciones técnicas.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Detectamos los fallos</h3>
              <p className="text-gray-600">
                Nuestro sistema identifica automáticamente cada pago que no se completó.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Recuperamos el dinero</h3>
              <p className="text-gray-600">
                Reintentos inteligentes en el momento óptimo. La mayoría se recuperan en 24 horas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Todo lo que necesitas para recuperar ingresos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-indigo-600 text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reintentos automáticos</h3>
              <p className="text-gray-600">
                Configuramos el timing perfecto para cada intento. Sin spam, solo cuando tiene sentido.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-indigo-600 text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard en tiempo real</h3>
              <p className="text-gray-600">
                Ve exactamente cuánto has recuperado, qué está pendiente y tu tasa de éxito.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-indigo-600 text-3xl mb-4">🔔</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notificaciones personalizadas</h3>
              <p className="text-gray-600">
                Recibe alertas solo cuando importan. Nada de ruido, toda la información relevante.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-indigo-600 text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Seguridad total</h3>
              <p className="text-gray-600">
                Tus datos están encriptados. Cumplimos con todas las regulaciones de Stripe.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-indigo-600 text-3xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics completos</h3>
              <p className="text-gray-600">
                Entiende por qué fallan los pagos y optimiza tu proceso de checkout.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-indigo-600 text-3xl mb-4">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración flexible</h3>
              <p className="text-gray-600">
                Personaliza intervalos, límites y estrategias según tu negocio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Precios que escalan contigo
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Empieza gratis y actualiza cuando lo necesites. Sin compromisos ni permanencias.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* FREE */}
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                €0<span className="text-lg text-gray-500">/mes</span>
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Hasta 50 pagos/mes
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Reintentos automáticos
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Dashboard básico
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  14 días de prueba
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full px-6 py-3 text-center font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
              >
                Empezar gratis
              </Link>
            </div>

            {/* PRO */}
            <div className="bg-indigo-600 p-8 rounded-xl shadow-xl border-2 border-indigo-700 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                Más popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold text-white mb-6">
                €49<span className="text-lg text-indigo-200">/mes</span>
              </div>
              <ul className="text-left space-y-3 mb-8 text-white">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  Hasta 500 pagos/mes
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  Todo de Free +
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  Analytics avanzados
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  Soporte prioritario
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  API access
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full px-6 py-3 text-center font-medium text-indigo-600 bg-white rounded-lg hover:bg-gray-100 transition"
              >
                Empezar ahora
              </Link>
            </div>

            {/* ENTERPRISE */}
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                €199<span className="text-lg text-gray-500">/mes</span>
              </div>
              <ul className="text-left space-y-3 mb-8 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Pagos ilimitados
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Todo de Pro +
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Soporte 24/7
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Webhooks personalizados
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  SLA garantizado
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full px-6 py-3 text-center font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
              >
                Contactar ventas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para recuperar tus ingresos perdidos?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Únete a decenas de creadores que ya están recuperando miles de euros cada mes.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition shadow-lg"
          >
            Empezar gratis ahora
          </Link>
          <p className="mt-6 text-sm text-gray-400">
            Sin tarjeta de crédito · Configuración en 2 minutos · Soporte en español
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#how-it-works" className="hover:text-white transition">Cómo funciona</a></li>
                <li><a href="#" className="hover:text-white transition">Precios</a></li>
                <li><Link to="/register" className="hover:text-white transition">Empezar gratis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="mailto:support@whoprecovery.com" className="hover:text-white transition">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Términos</a></li>
                <li><a href="#" className="hover:text-white transition">Privacidad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Whop Recovery. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
