import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function OnboardingModal({ onComplete, manualOpen = false, onClose, onOpenSettings }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(manualOpen);

  const steps = [
    {
      title: '¡Bienvenido a Whop Recovery! 🎉',
      description: 'Vamos a configurar tu cuenta en 3 simples pasos para que puedas empezar a recuperar pagos automáticamente.',
      icon: '👋',
      action: 'Empezar'
    },
    {
      title: 'Conecta tu API de Whop',
      description: 'Para detectar automáticamente pagos fallidos, necesitas conectar tu API key de Whop.',
      icon: '🔗',
      action: 'Ir a Integraciones',
      openSettings: true
    },
    {
      title: 'Configura SendGrid',
      description: 'Los emails de recuperación se envían con SendGrid. Añade tu API key para empezar.',
      icon: '📧',
      action: 'Configurar Email',
      openSettings: true
    },
    {
      title: 'Crea tu primer reintento',
      description: 'Define cuándo y cómo reintentar los pagos fallidos. Recomendamos: 1h, 24h, 72h.',
      icon: '🔄',
      action: 'Continuar'
    },
    {
      title: '¡Listo para recuperar! 🚀',
      description: 'Ya tienes todo configurado. Whop Recovery detectará automáticamente los pagos fallidos y los recuperará por ti.',
      icon: '✅',
      action: 'Finalizar',
      isLast: true
    }
  ];

  useEffect(() => {
    // Solo abrir automáticamente si se pasa manualOpen=true
    if (manualOpen) {
      setIsOpen(true);
    }
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
      // Abrir settings modal
      if (onOpenSettings) {
        onOpenSettings();
      }
      setIsOpen(false);
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
              Paso {currentStep + 1} de {steps.length}
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
              <h3 className="font-semibold text-gray-900 mb-4">Lo que vas a configurar:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🔗</span>
                  <div>
                    <div className="font-medium text-gray-900">API de Whop</div>
                    <div className="text-sm text-gray-600">Detectar pagos fallidos automáticamente</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">📧</span>
                  <div>
                    <div className="font-medium text-gray-900">SendGrid</div>
                    <div className="text-sm text-gray-600">Enviar emails de recuperación</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🔄</span>
                  <div>
                    <div className="font-medium text-gray-900">Reintentos</div>
                    <div className="text-sm text-gray-600">Automatizar la recuperación</div>
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
                <div className="text-sm font-medium text-green-900">Trial de 14 días</div>
                <div className="text-xs text-green-700">Gratis, sin tarjeta</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-sm font-medium text-blue-900">Hasta 50 pagos</div>
                <div className="text-xs text-blue-700">Durante el trial</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-sm font-medium text-purple-900">Recovery 24/7</div>
                <div className="text-xs text-purple-700">Automático</div>
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
              ← Anterior
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
                Saltar tutorial (puedes volver después)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
