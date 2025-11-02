import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function OnboardingModal({ onComplete, manualOpen = false, onClose, onOpenSettings }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(manualOpen);

  const steps = [
    {
      title: t('onboarding.steps.welcome.title'),
      description: t('onboarding.steps.welcome.description'),
      icon: '👋',
      action: t('onboarding.steps.welcome.action')
    },
    {
      title: t('onboarding.steps.connectWhop.title'),
      description: t('onboarding.steps.connectWhop.description'),
      icon: '🔗',
      action: t('onboarding.steps.connectWhop.action'),
      openSettings: true
    },
    {
      title: t('onboarding.steps.configureSendgrid.title'),
      description: t('onboarding.steps.configureSendgrid.description'),
      icon: '📧',
      action: t('onboarding.steps.configureSendgrid.action'),
      openSettings: true
    },
    {
      title: t('onboarding.steps.createRetry.title'),
      description: t('onboarding.steps.createRetry.description'),
      icon: '🔄',
      action: t('onboarding.navigation.next')
    },
    {
      title: t('onboarding.steps.ready.title'),
      description: t('onboarding.steps.ready.description'),
      icon: '✅',
      action: t('onboarding.steps.ready.action'),
      isLast: true
    }
  ];

  useEffect(() => {
    // Solo abrir automáticamente si se pasa manualOpen=true
    if (manualOpen) {
      setIsOpen(true);
    }

    // Listener para cuando se cierra el modal de settings
    const handleSettingsClosed = () => {
      const pausedStep = localStorage.getItem('onboarding_paused_step');
      if (pausedStep) {
        // Reabrir onboarding y avanzar al siguiente paso
        const nextStep = parseInt(pausedStep) + 1;
        setCurrentStep(nextStep);
        setIsOpen(true);
        localStorage.removeItem('onboarding_paused_step');
      }
    };

    window.addEventListener('settings_modal_closed', handleSettingsClosed);

    return () => {
      window.removeEventListener('settings_modal_closed', handleSettingsClosed);
    };
  }, [manualOpen]);

  const saveProgress = async (step) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/user/onboarding`,
        { step },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  };

  const handleNext = () => {
    const nextStep = currentStep + 1;
    
    if (nextStep >= steps.length) {
      // Completado
      saveProgress(4);
      setIsOpen(false);
      if (onComplete) onComplete();
      return;
    }

    setCurrentStep(nextStep);
    saveProgress(nextStep);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleActionClick = () => {
    const step = steps[currentStep];
    
    if (step.openSettings) {
      // Guardar progreso actual antes de abrir settings
      saveProgress(currentStep);
      
      // Abrir settings modal
      if (onOpenSettings) {
        onOpenSettings();
      }
      
      // NO cerrar el modal onboarding, solo minimizarlo
      // El usuario puede volver cuando cierre settings
      localStorage.setItem('onboarding_paused_step', currentStep.toString());
    } else if (step.isLast) {
      // Finalizar onboarding
      handleNext();
    } else {
      // Siguiente paso
      handleNext();
    }
  };

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{step.icon}</div>
            <div className="text-sm text-gray-500 font-medium">
              {t('onboarding.step', { current: currentStep + 1, total: steps.length })}
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
            <p className="text-lg text-gray-600">{step.description}</p>
          </div>

          {/* Checklist visual (solo en paso 1) */}
          {currentStep === 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">{t('onboarding.checklist.title')}</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🔗</span>
                  <div>
                    <div className="font-medium text-gray-900">{t('onboarding.checklist.whop.title')}</div>
                    <div className="text-sm text-gray-600">{t('onboarding.checklist.whop.description')}</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">📧</span>
                  <div>
                    <div className="font-medium text-gray-900">{t('onboarding.checklist.sendgrid.title')}</div>
                    <div className="text-sm text-gray-600">{t('onboarding.checklist.sendgrid.description')}</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🔄</span>
                  <div>
                    <div className="font-medium text-gray-900">{t('onboarding.checklist.retries.title')}</div>
                    <div className="text-sm text-gray-600">{t('onboarding.checklist.retries.description')}</div>
                  </div>
                </li>
              </ul>
            </div>
          )}

          {/* Stats preview (último paso) */}
          {currentStep === steps.length - 1 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <div className="text-sm font-medium text-green-900">{t('onboarding.finalStats.trial.title')}</div>
                <div className="text-xs text-green-700">{t('onboarding.finalStats.trial.subtitle')}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-sm font-medium text-blue-900">{t('onboarding.finalStats.payments.title')}</div>
                <div className="text-xs text-blue-700">{t('onboarding.finalStats.payments.subtitle')}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-sm font-medium text-purple-900">{t('onboarding.finalStats.recovery.title')}</div>
                <div className="text-xs text-purple-700">{t('onboarding.finalStats.recovery.subtitle')}</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              ← {t('onboarding.navigation.back')}
            </button>

            <button
              onClick={handleActionClick}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              {step.action} →
            </button>
          </div>

          {/* Skip link (excepto último paso) */}
          {!step.isLast && (
            <div className="text-center mt-6">
              <button
                onClick={() => {
                  saveProgress(4);
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {t('onboarding.skip')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
