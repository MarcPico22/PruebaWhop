import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Footer from './components/Footer';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';

// Componente: Microsección "¿Cuánto dinero estás perdiendo?"
function MoneyLossCalculator() {
  const { t } = useTranslation();
  const [monthlyRevenue, setMonthlyRevenue] = useState(15000);

  // Estadísticas reales: 5-9% de pagos fallan
  const averageFailureRate = 0.07; // 7% (conservador)
  const monthlyLoss = monthlyRevenue * averageFailureRate;
  const annualLoss = monthlyLoss * 12;
  const recoverable = annualLoss * 0.85; // 85% tasa de recuperación

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          {t('landing.calculator.title')}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 mb-10">
          {t('landing.calculator.subtitle')} <span className="text-red-600 font-semibold">{t('landing.calculator.moneyNeverSee')}</span>
        </p>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border-2 border-orange-200">
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t('landing.calculator.monthlyRevenueLabel')}
            </label>
            <div className="relative max-w-md mx-auto">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-500 font-bold">€</span>
              <input
                type="number"
                value={monthlyRevenue}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMonthlyRevenue(isNaN(val) ? 0 : val);
                }}
                className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none text-center"
              />
            </div>
            <input
              type="range"
              min="5000"
              max="100000"
              step="5000"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(parseInt(e.target.value))}
              className="w-full mt-4 max-w-md mx-auto"
              style={{ accentColor: '#f97316' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-red-600 text-white rounded-xl p-4 sm:p-6">
              <div className="text-xs sm:text-sm font-medium opacity-90 mb-1">{t('landing.calculator.lossPerMonth')}</div>
              <div className="text-2xl sm:text-4xl font-black">€{monthlyLoss.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</div>
            </div>

            <div className="bg-orange-500 text-white rounded-xl p-4 sm:p-6">
              <div className="text-xs sm:text-sm font-medium opacity-90 mb-1">{t('landing.calculator.lossPerYear')}</div>
              <div className="text-2xl sm:text-4xl font-black">€{annualLoss.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</div>
            </div>

            <div className="bg-green-600 text-white rounded-xl p-4 sm:p-6">
              <div className="text-xs sm:text-sm font-medium opacity-90 mb-1">{t('landing.calculator.couldRecover')}</div>
              <div className="text-2xl sm:text-4xl font-black">€{recoverable.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 sm:p-6 mb-6">
            <p className="text-gray-800 font-medium text-sm sm:text-base">
              💡 <strong>{t('landing.calculator.realScenario')}</strong> {t('landing.calculator.realScenarioText', {
                revenue: `€${monthlyRevenue.toLocaleString('es-ES')}`,
                loss: `€${monthlyLoss.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
                recovered: `€${(monthlyLoss * 0.85).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`
              })}{' '}
              <span className="underline">{t('landing.calculator.automatically')}</span>
            </p>
          </div>

          <Link
            to="/signup"
            className="inline-block px-6 sm:px-10 py-3 sm:py-5 text-base sm:text-xl font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-xl hover:from-orange-700 hover:to-red-700 transition shadow-2xl active:scale-95"
          >
            {t('landing.calculator.ctaButton')}
          </Link>
          <p className="mt-4 text-xs sm:text-sm text-gray-500">
            Sin tarjeta · Listo en 3 minutos · Cancela cuando quieras
          </p>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Mobile Optimized */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm fixed w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link to="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Whop Recovery
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSelector />
              <Link
                to="/pricing"
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                {t('nav.pricing')}
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition active:scale-95"
                >
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition active:scale-95"
                >
                  {t('nav.signup')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero - Claridad y Urgencia */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 border border-red-300 rounded-full">
            <span className="text-xs sm:text-sm font-semibold text-red-700">
              {t('landing.hero.badge')}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4 sm:mb-6 leading-tight">
            {t('landing.hero.title')}
          </h1>

          <p className="text-base sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
            <Link
              to="/signup"
              className="px-6 sm:px-10 py-3 sm:py-5 text-base sm:text-lg font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-xl active:scale-95"
            >
              {t('landing.hero.cta')}
            </Link>
            <a
              href="#how-it-works"
              className="px-6 sm:px-10 py-3 sm:py-5 text-base sm:text-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 transition active:scale-95"
            >
              {t('landing.hero.ctaSecondary')}
            </a>
          </div>

          {/* Trust Logos - Autoridad Prestada */}
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm font-semibold text-gray-500 mb-6 uppercase tracking-wider">
              {t('landing.hero.trustedBy')}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Whop Logo */}
              <div className="flex items-center gap-2 group cursor-default">
                <span className="text-2xl font-black text-gray-400 group-hover:text-[#FF6243] transition-colors">Whop</span>
              </div>

              {/* Stripe Logo */}
              <div className="flex items-center gap-2 group cursor-default">
                <span className="text-2xl font-bold text-gray-400 group-hover:text-[#635BFF] transition-colors tracking-tighter">stripe</span>
              </div>

              {/* SendGrid Logo */}
              <div className="flex items-center gap-2 group cursor-default">
                <span className="text-xl font-bold text-gray-400 group-hover:text-[#1A82E2] transition-colors">SendGrid</span>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-1.5 bg-gray-50">
                <span className="text-xs font-medium text-gray-600">{t('landing.hero.secureBadge')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Social Proof */}
      <section className="py-10 sm:py-16 bg-indigo-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center text-white">
            <div>
              <div className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2">85%</div>
              <div className="text-xs sm:text-base text-indigo-100 font-medium">{t('landing.heroStats.recovery')}</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2">€48K</div>
              <div className="text-xs sm:text-base text-indigo-100 font-medium">{t('landing.heroStats.thisMonth')}</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2">24h</div>
              <div className="text-xs sm:text-base text-indigo-100 font-medium">{t('landing.heroStats.average')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculadora de Pérdidas */}
      <MoneyLossCalculator />

      {/* How It Works - Simplicidad */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-3 sm:mb-4">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12">
            {['step1', 'step2', 'step3'].map((step, i) => (
              <div key={i} className="text-center p-6 sm:p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100">
                <div className="text-5xl sm:text-6xl mb-4">{t(`landing.howItWorks.${step}.icon`)}</div>
                <div className="inline-block w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <span className="text-xl sm:text-3xl font-black text-white">{i + 1}</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t(`landing.howItWorks.${step}.title`)}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{t(`landing.howItWorks.${step}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Beneficios Claros */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-center text-gray-900 mb-12 sm:mb-20">
            {t('landing.benefitsSection.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {['automatic', 'dashboard', 'alerts', 'security', 'analytics', 'customizable'].map((key, i) => {
              const icons = ["⚡", "📊", "🔔", "🔒", "📈", "⚙️"];
              return (
                <div key={i} className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{icons[i]}</div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{t(`landing.benefitsSection.${key}.title`)}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{t(`landing.benefitsSection.${key}.description`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final - Urgencia */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 sm:mb-6">
            {t('landing.finalCta.title')}
          </h2>
          <p className="text-lg sm:text-2xl text-indigo-100 mb-8 sm:mb-10">
            {t('landing.finalCta.subtitle')} <br className="hidden sm:block" />
            <strong className="text-white">{t('landing.finalCta.subtitleBold')}</strong>
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-2xl font-black text-indigo-600 bg-white rounded-xl hover:bg-gray-50 transition shadow-2xl active:scale-95"
          >
            {t('landing.finalCta.cta')}
          </Link>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-indigo-200">
            {t('landing.finalCta.terms')}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
