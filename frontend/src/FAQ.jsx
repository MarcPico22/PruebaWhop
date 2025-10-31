import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from './components/Footer';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "¿Cómo funciona Whop Recovery?",
      answer: "Whop Recovery se conecta automáticamente a tu cuenta de Whop y monitoriza todos los pagos fallidos. Cuando detecta un fallo, reintenta el cobro de forma inteligente en los momentos óptimos (cuando es más probable que el pago tenga éxito). Todo esto ocurre en segundo plano, sin que tengas que hacer nada."
    },
    {
      question: "¿Cuánto cuesta?",
      answer: "Ofrecemos tres planes: GRATIS (hasta 10 reintentos/mes), PRO (€49/mes o €499/año con reintentos ilimitados) y ENTERPRISE (€199/mes o €2.099/año con soporte prioritario y analytics avanzados). Solo pagas por los reintentos exitosos en el plan gratuito."
    },
    {
      question: "¿Qué tasa de recuperación puedo esperar?",
      answer: "Nuestros clientes recuperan de media el 85% de los pagos fallidos. Esto significa que si pierdes €1.000 al mes por pagos fallidos, podrías recuperar €850 automáticamente."
    },
    {
      question: "¿Es seguro conectar mi cuenta de Whop?",
      answer: "Sí, totalmente seguro. Utilizamos OAuth 2.0 (el mismo sistema que usa Google y Facebook) y encriptación de grado bancario. Solo solicitamos los permisos mínimos necesarios y nunca almacenamos información sensible de pagos. Además, puedes revocar el acceso en cualquier momento desde tu panel de Whop."
    },
    {
      question: "¿Cuándo se intentan los reintentos?",
      answer: "Nuestro sistema inteligente analiza patrones de comportamiento y realiza los reintentos en momentos óptimos: cuando el cliente tiene más probabilidades de tener fondos disponibles. Típicamente, hacemos 3-5 intentos espaciados a lo largo de 7-14 días, pero puedes personalizar esta configuración en tu dashboard."
    },
    {
      question: "¿Afectará esto a mi relación con los clientes?",
      answer: "No. Los reintentos son discretos y profesionales. Whop maneja las notificaciones a los clientes de forma estándar (igual que cuando hacen un pago manual). Nosotros simplemente automatizamos el proceso de reintento que normalmente tendrías que hacer manualmente."
    },
    {
      question: "¿Puedo cancelar en cualquier momento?",
      answer: "Sí, puedes cancelar tu suscripción cuando quieras desde el dashboard. No hay contratos de permanencia ni penalizaciones. Si cancelas, seguirás teniendo acceso hasta el final de tu período de facturación actual."
    },
    {
      question: "¿Qué pasa si un reintento falla?",
      answer: "Si un reintento falla, el sistema lo marca y programa el siguiente intento de forma inteligente. Puedes ver todos los intentos (exitosos y fallidos) en tu dashboard con análisis detallados. Después del número máximo de intentos configurados, el sistema deja de reintentar ese pago específico."
    },
    {
      question: "¿Necesito conocimientos técnicos?",
      answer: "No, para nada. La configuración es super simple: conectas tu cuenta de Whop con un click, y el sistema empieza a funcionar automáticamente. El dashboard es intuitivo y no requiere ningún conocimiento técnico."
    },
    {
      question: "¿Ofrecen soporte?",
      answer: "Sí. Todos los planes incluyen soporte por email. El plan ENTERPRISE incluye soporte prioritario con tiempos de respuesta garantizados de menos de 4 horas. También tenemos documentación completa y tutoriales en vídeo."
    },
    {
      question: "¿Puedo ver estadísticas de recuperación?",
      answer: "Absolutamente. Tu dashboard incluye analytics en tiempo real: tasa de recuperación, ingresos recuperados, tendencias, mejores momentos de reintento, y mucho más. El plan ENTERPRISE incluye reportes avanzados y exportación de datos."
    },
    {
      question: "¿Funciona con todos los métodos de pago de Whop?",
      answer: "Sí, Whop Recovery funciona con todos los métodos de pago soportados por Whop (tarjetas de crédito, débito, Apple Pay, Google Pay, etc.). El sistema se adapta automáticamente al método de pago de cada transacción."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <nav className="border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Whop Recovery
            </Link>
            <div className="flex gap-4">
              <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">
                Precios
              </Link>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                Iniciar sesión
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Empezar gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-300">
            Todo lo que necesitas saber sobre Whop Recovery
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-800/70 transition-colors"
              >
                <span className="text-lg font-semibold text-white pr-8">
                  {faq.question}
                </span>
                <svg 
                  className={`w-6 h-6 text-purple-400 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-300 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Aún tienes dudas?
          </h2>
          <p className="text-gray-300 mb-6">
            Estamos aquí para ayudarte. Contáctanos y te responderemos en menos de 24 horas.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="mailto:support@whoprecovery.com"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
            >
              Contactar soporte
            </a>
            <Link 
              to="/register"
              className="bg-white text-purple-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-all font-semibold"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default FAQ;
