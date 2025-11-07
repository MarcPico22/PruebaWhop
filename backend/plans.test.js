const { describe, it, expect, vi, beforeEach } = require('vitest');
const { canProcessPayment } = require('./plans');

describe('Plans Module - canProcessPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Trial Expired', () => {
    it('debería rechazar si el trial expiró', () => {
      const subscription = {
        plan: 'free',
        status: 'trial',
        trial_ends_at: Math.floor(Date.now() / 1000) - 86400, // Expiró hace 1 día
        payments_limit: 50,
        payments_used: 10
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('trial_expired');
      expect(result.message).toContain('trial ha expirado');
    });

    it('debería permitir si el trial NO ha expirado', () => {
      const subscription = {
        plan: 'free',
        status: 'trial',
        trial_ends_at: Math.floor(Date.now() / 1000) + 86400, // Expira en 1 día
        payments_limit: 50,
        payments_used: 10
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Limit Reached', () => {
    it('debería rechazar si se alcanzó el límite (50/50 en plan free)', () => {
      const subscription = {
        plan: 'free',
        status: 'active',
        trial_ends_at: null,
        payments_limit: 50,
        payments_used: 50 // Límite alcanzado
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('limit_reached');
      expect(result.message).toContain('límite de 50 pagos');
    });

    it('debería rechazar si se excedió el límite (51/50)', () => {
      const subscription = {
        plan: 'free',
        status: 'active',
        payments_limit: 50,
        payments_used: 51 // Excedido
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('limit_reached');
    });

    it('debería permitir si aún hay espacio (49/50)', () => {
      const subscription = {
        plan: 'free',
        status: 'active',
        payments_limit: 50,
        payments_used: 49
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
    });

    it('debería permitir en plan PRO con límite mayor', () => {
      const subscription = {
        plan: 'pro',
        status: 'active',
        payments_limit: 500,
        payments_used: 499
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Subscription Inactive', () => {
    it('debería rechazar si el status es "past_due"', () => {
      const subscription = {
        plan: 'pro',
        status: 'past_due', // Pago de suscripción falló
        payments_limit: 500,
        payments_used: 100
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('subscription_inactive');
      expect(result.message).toContain('suscripción no está activa');
    });

    it('debería rechazar si el status es "canceled"', () => {
      const subscription = {
        plan: 'pro',
        status: 'canceled',
        payments_limit: 500,
        payments_used: 100
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('subscription_inactive');
    });

    it('debería rechazar si el status es "unpaid"', () => {
      const subscription = {
        plan: 'enterprise',
        status: 'unpaid',
        payments_limit: 10000,
        payments_used: 500
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('subscription_inactive');
    });

    it('debería permitir si el status es "active"', () => {
      const subscription = {
        plan: 'pro',
        status: 'active',
        payments_limit: 500,
        payments_used: 100
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
    });

    it('debería permitir si el status es "trialing"', () => {
      const subscription = {
        plan: 'pro',
        status: 'trialing',
        payments_limit: 500,
        payments_used: 10
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Allowed Cases', () => {
    it('debería permitir en plan ENTERPRISE sin restricciones', () => {
      const subscription = {
        plan: 'enterprise',
        status: 'active',
        payments_limit: 999999,
        payments_used: 5000
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('debería permitir en plan FREE con trial activo', () => {
      const subscription = {
        plan: 'free',
        status: 'trial',
        trial_ends_at: Math.floor(Date.now() / 1000) + 604800, // 7 días restantes
        payments_limit: 50,
        payments_used: 5
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
    });

    it('debería permitir en plan PRO con status "active"', () => {
      const subscription = {
        plan: 'pro',
        status: 'active',
        payments_limit: 500,
        payments_used: 250
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('debería manejar suscripción sin payments_limit', () => {
      const subscription = {
        plan: 'custom',
        status: 'active',
        payments_limit: null,
        payments_used: 100
      };

      // Dependiendo de tu implementación, puede lanzar error o asumir ilimitado
      // Aquí asumimos que null = ilimitado
      const result = canProcessPayment(subscription);
      expect(result.allowed).toBe(true);
    });

    it('debería manejar trial_ends_at = null (sin trial)', () => {
      const subscription = {
        plan: 'pro',
        status: 'active',
        trial_ends_at: null,
        payments_limit: 500,
        payments_used: 10
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(true);
    });

    it('debería rechazar múltiples condiciones (trial expirado + límite alcanzado)', () => {
      const subscription = {
        plan: 'free',
        status: 'trial',
        trial_ends_at: Math.floor(Date.now() / 1000) - 86400,
        payments_limit: 50,
        payments_used: 50
      };

      const result = canProcessPayment(subscription);

      expect(result.allowed).toBe(false);
      // Debería priorizar trial_expired (primero en la lógica)
      expect(result.reason).toBe('trial_expired');
    });
  });
});
