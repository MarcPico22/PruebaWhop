const { describe, it, expect, vi, beforeEach } = require('vitest');
const { register, login } = require('./auth');
const bcrypt = require('bcryptjs');
const db = require('./db');

// Mock de bcryptjs
vi.mock('bcryptjs');

// Mock de db.js
vi.mock('./db', () => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn()
}));

describe('Auth Module', () => {
  beforeEach(() => {
    // Reset mocks antes de cada test
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('debería rechazar un usuario que ya existe', async () => {
      // Arrange: Simular que el usuario ya existe
      db.getUserByEmail.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      // Act & Assert
      await expect(
        register('test@example.com', 'password123', 'Test Company')
      ).rejects.toThrow('El email ya está registrado');

      // Verificar que se llamó a getUserByEmail pero NO a createUser
      expect(db.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(db.createUser).not.toHaveBeenCalled();
    });

    it('debería crear un usuario nuevo si no existe', async () => {
      // Arrange: Simular que el usuario NO existe
      db.getUserByEmail.mockReturnValue(null);
      bcrypt.hash.mockResolvedValue('hashedpassword123');
      db.createUser.mockReturnValue({
        id: 'new-id',
        email: 'newuser@example.com',
        company_name: 'New Company',
        tenant_id: 'tenant-123'
      });

      // Act
      const result = await register('newuser@example.com', 'securepass', 'New Company');

      // Assert
      expect(db.getUserByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('securepass', 10);
      expect(db.createUser).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'new-id');
      expect(result).toHaveProperty('email', 'newuser@example.com');
      expect(result).toHaveProperty('tenant_id', 'tenant-123');
    });

    it('debería generar un tenant_id único', async () => {
      db.getUserByEmail.mockReturnValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      db.createUser.mockReturnValue({ id: '1', tenant_id: 'tenant-abc' });

      const result1 = await register('user1@test.com', 'pass', 'Company 1');
      const result2 = await register('user2@test.com', 'pass', 'Company 2');

      // Verificar que se llamó a createUser 2 veces con diferentes tenant_id
      expect(db.createUser).toHaveBeenCalledTimes(2);
      const call1 = db.createUser.mock.calls[0][0];
      const call2 = db.createUser.mock.calls[1][0];
      expect(call1.tenant_id).not.toBe(call2.tenant_id);
    });
  });

  describe('login', () => {
    it('debería rechazar un email que no existe', async () => {
      // Arrange
      db.getUserByEmail.mockReturnValue(null);

      // Act & Assert
      await expect(
        login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Usuario no encontrado');

      expect(db.getUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('debería rechazar una contraseña incorrecta', async () => {
      // Arrange: Usuario existe pero contraseña es incorrecta
      db.getUserByEmail.mockReturnValue({
        id: '123',
        email: 'user@example.com',
        password: 'correcthash',
        company_name: 'Test Co',
        tenant_id: 'tenant-123'
      });
      bcrypt.compare.mockResolvedValue(false); // Contraseña incorrecta

      // Act & Assert
      await expect(
        login('user@example.com', 'wrongpassword')
      ).rejects.toThrow('Contraseña incorrecta');

      expect(db.getUserByEmail).toHaveBeenCalledWith('user@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'correcthash');
    });

    it('debería devolver el usuario si la contraseña es correcta', async () => {
      // Arrange
      const mockUser = {
        id: '456',
        email: 'valid@example.com',
        password: 'validhash',
        company_name: 'Valid Company',
        tenant_id: 'tenant-456'
      };
      db.getUserByEmail.mockReturnValue(mockUser);
      bcrypt.compare.mockResolvedValue(true); // Contraseña correcta

      // Act
      const result = await login('valid@example.com', 'correctpassword');

      // Assert
      expect(db.getUserByEmail).toHaveBeenCalledWith('valid@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'validhash');
      expect(result).toEqual({
        id: '456',
        email: 'valid@example.com',
        company_name: 'Valid Company',
        tenant_id: 'tenant-456'
        // password NO debe estar en el resultado
      });
      expect(result).not.toHaveProperty('password');
    });

    it('debería eliminar la contraseña del objeto devuelto', async () => {
      db.getUserByEmail.mockReturnValue({
        id: '789',
        email: 'secure@example.com',
        password: 'hashvalue',
        tenant_id: 'tenant-789'
      });
      bcrypt.compare.mockResolvedValue(true);

      const result = await login('secure@example.com', 'mypassword');

      // Verificar que password NO está en el resultado
      expect(result.password).toBeUndefined();
      expect(Object.keys(result)).not.toContain('password');
    });
  });
});
