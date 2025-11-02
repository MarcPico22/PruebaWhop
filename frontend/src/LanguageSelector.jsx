import { useTranslation } from 'react-i18next';
import { trackEvent } from './useAnalytics';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    const previousLang = i18n.language;
    i18n.changeLanguage(lng);
    
    // Track language change
    trackEvent('language_selected', {
      new_language: lng,
      previous_language: previousLang,
      context: window.location.pathname
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          i18n.language === 'en'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="English"
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => changeLanguage('es')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          i18n.language === 'es'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Español"
      >
        🇪🇸 ES
      </button>
    </div>
  );
}
