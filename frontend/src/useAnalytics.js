import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook para trackear cambios de idioma en Google Analytics
 */
export function useLanguageTracking() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      // Google Analytics 4 event
      if (window.gtag) {
        window.gtag('event', 'language_change', {
          language: lng,
          previous_language: i18n.language,
          timestamp: new Date().toISOString()
        });
      }
      
      // Custom event for additional tracking
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'languageChanged',
          language: lng,
          userId: localStorage.getItem('userId') || 'anonymous'
        });
      }
      
      console.log(`🌍 Language changed to: ${lng}`);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
}

/**
 * Trackear evento personalizado
 */
export function trackEvent(eventName, eventParams = {}) {
  if (window.gtag) {
    window.gtag('event', eventName, {
      ...eventParams,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Trackear vista de página
 */
export function trackPageView(pageName) {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }
}
