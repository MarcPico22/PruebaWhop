import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-gray-200 bg-white mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-indigo-600 mb-4">
              Whop Recovery
            </h3>
            <p className="text-gray-600 text-sm">
              {t('landing.footer.description')}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('landing.footer.product')}</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link to="/pricing" className="hover:text-indigo-600 transition-colors">{t('landing.footer.pricing')}</Link></li>
              <li><Link to="/faq" className="hover:text-indigo-600 transition-colors">FAQ</Link></li>
              <li><Link to="/#features" className="hover:text-indigo-600 transition-colors">{t('landing.footer.features')}</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-indigo-600 transition-colors">{t('landing.footer.changelog')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('landing.footer.support')}</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><a href="mailto:support@whoprecovery.com" className="hover:text-indigo-600 transition-colors">{t('landing.footer.contact')}</a></li>
              <li><a href="mailto:support@whoprecovery.com" className="hover:text-indigo-600 transition-colors">{t('landing.footer.docs')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('landing.footer.legal')}</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link to="/privacy" className="hover:text-indigo-600 transition-colors">{t('landing.footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-indigo-600 transition-colors">{t('landing.footer.terms')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Whop Recovery. {t('landing.footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
