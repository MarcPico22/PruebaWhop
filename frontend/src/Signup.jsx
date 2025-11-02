import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';
import { trackSignup } from './analytics';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';

export default function Signup() {
  const { t } = useTranslation();
  const { register, user } = useAuth();
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    company_name: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validación básica
    if (formData.password.length < 6) {
      setError(t('signup.passwordError'));
      setLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.password, formData.company_name);
      
      // 📊 Track signup exitoso
      trackSignup('email');
      
      // La redirección se hace automáticamente
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4 sm:p-6">
      {/* Language Selector - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">💰 Whop Recovery</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('signup.subtitle')}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              {t('signup.companyName')}
            </label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
              placeholder={t('signup.companyPlaceholder')}
              autoComplete="organization"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              {t('signup.emailLabel')}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
              placeholder={t('signup.emailPlaceholder')}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              {t('signup.passwordLabel')}
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? t('signup.loadingButton') : t('signup.submitButton')}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-sm sm:text-base text-gray-600">
            {t('signup.hasAccount')}{' '}
            <a href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
              {t('signup.login')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
