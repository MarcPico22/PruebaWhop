import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Footer from './components/Footer';
import LanguageSelector from './LanguageSelector';

function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: t('faq.questions.howItWorks.question'),
      answer: t('faq.questions.howItWorks.answer')
    },
    {
      question: t('faq.questions.pricing.question'),
      answer: t('faq.questions.pricing.answer')
    },
    {
      question: t('faq.questions.recoveryRate.question'),
      answer: t('faq.questions.recoveryRate.answer')
    },
    {
      question: t('faq.questions.security.question'),
      answer: t('faq.questions.security.answer')
    },
    {
      question: t('faq.questions.retryTiming.question'),
      answer: t('faq.questions.retryTiming.answer')
    },
    {
      question: t('faq.questions.customerRelation.question'),
      answer: t('faq.questions.customerRelation.answer')
    },
    {
      question: t('faq.questions.cancellation.question'),
      answer: t('faq.questions.cancellation.answer')
    },
    {
      question: t('faq.questions.failedRetry.question'),
      answer: t('faq.questions.failedRetry.answer')
    },
    {
      question: t('faq.questions.technical.question'),
      answer: t('faq.questions.technical.answer')
    },
    {
      question: t('faq.questions.support.question'),
      answer: t('faq.questions.support.answer')
    },
    {
      question: t('faq.questions.analytics.question'),
      answer: t('faq.questions.analytics.answer')
    },
    {
      question: t('faq.questions.paymentMethods.question'),
      answer: t('faq.questions.paymentMethods.answer')
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
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">
                {t('nav.pricing')}
              </Link>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                {t('nav.login')}
              </Link>
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                {t('nav.signup')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            {t('faq.title')}
          </h1>
          <p className="text-xl text-gray-300">
            {t('faq.subtitle')}
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
            {t('faq.cta.title')}
          </h2>
          <p className="text-gray-300 mb-6">
            {t('faq.cta.description')}
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="mailto:support@whoprecovery.com"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
            >
              {t('faq.cta.contactButton')}
            </a>
            <Link 
              to="/signup"
              className="bg-white text-purple-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-all font-semibold"
            >
              {t('faq.cta.startButton')}
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default FAQ;
