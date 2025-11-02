const { v4: uuidv4 } = require('uuid');

/**
 * Sistema de Gamificación - Achievements
 */

// Definición de badges disponibles
const BADGE_TYPES = {
  FIRST_RECOVERY: {
    id: 'first_recovery',
    name: 'Primer Pago Recuperado',
    description: 'Recuperaste tu primer pago fallido',
    icon: '🎉',
    condition: (stats) => stats.recovered >= 1
  },
  MILESTONE_10: {
    id: 'milestone_10',
    name: '10 Pagos Recuperados',
    description: 'Recuperaste 10 pagos',
    icon: '💪',
    condition: (stats) => stats.recovered >= 10
  },
  PERFECT_RATE: {
    id: 'perfect_rate',
    name: 'Tasa de Éxito 100%',
    description: 'Todos tus pagos fueron recuperados',
    icon: '🏆',
    condition: (stats) => stats.total > 0 && stats.recovered === stats.total
  },
  MILESTONE_50: {
    id: 'milestone_50',
    name: '50 Pagos Recuperados',
    description: 'Recuperaste 50 pagos',
    icon: '🚀',
    condition: (stats) => stats.recovered >= 50
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Recuperación Rápida',
    description: 'Recuperaste un pago en menos de 1 hora',
    icon: '⚡',
    condition: (stats) => stats.fastest_recovery && stats.fastest_recovery < 3600
  }
};

/**
 * Obtiene las estadísticas de pagos de un tenant
 */
function getPaymentStats(db, tenantId) {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'recovered' THEN 1 ELSE 0 END) as recovered,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      MIN(CASE 
        WHEN status = 'recovered' 
        THEN last_attempt - created_at 
        ELSE NULL 
      END) as fastest_recovery
    FROM payments
    WHERE tenant_id = ?
  `).get(tenantId);

  return {
    total: stats.total || 0,
    recovered: stats.recovered || 0,
    failed: stats.failed || 0,
    fastest_recovery: stats.fastest_recovery || null
  };
}

/**
 * Verifica y desbloquea achievements para un usuario
 */
function checkAndUnlockAchievements(db, userId, tenantId) {
  try {
    const stats = getPaymentStats(db, tenantId);
    const newBadges = [];

    // Obtener badges ya desbloqueados
    const existingBadges = db.prepare(`
      SELECT badge_type FROM achievements WHERE user_id = ?
    `).all(userId);

    const unlockedTypes = new Set(existingBadges.map(b => b.badge_type));

  // Verificar cada tipo de badge
  for (const [key, badge] of Object.entries(BADGE_TYPES)) {
    // Si ya está desbloqueado, skip
    if (unlockedTypes.has(badge.id)) continue;

    // Verificar condición
    if (badge.condition(stats)) {
      // Desbloquear badge
      const achievementId = uuidv4();
      const now = Math.floor(Date.now() / 1000);

      db.prepare(`
        INSERT INTO achievements (id, user_id, tenant_id, badge_type, unlocked_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        achievementId,
        userId,
        tenantId,
        badge.id,
        now,
        JSON.stringify({ stats })
      );

      newBadges.push({
        id: achievementId,
        badge_type: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlocked_at: now
      });

      console.log(`🏆 Badge desbloqueado: ${badge.name} para usuario ${userId}`);
    }
  }

  return newBadges;
  } catch (error) {
    console.error('Error en checkAndUnlockAchievements:', error.message);
    if (error.message.includes('no such table')) {
      console.warn('⚠️  Tabla achievements no existe. Retornando array vacío.');
      return [];
    }
    throw error;
  }
}

/**
 * Obtiene todos los achievements de un usuario
 */
function getUserAchievements(db, userId) {
  try {
    const achievements = db.prepare(`
      SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC
    `).all(userId);

    // Enriquecer con información de badge
    return achievements.map(a => {
      const badgeInfo = Object.values(BADGE_TYPES).find(b => b.id === a.badge_type);
      return {
        ...a,
        name: badgeInfo?.name || 'Unknown Badge',
        description: badgeInfo?.description || '',
        icon: badgeInfo?.icon || '🎖️'
      };
    });
  } catch (error) {
    console.error('Error obteniendo achievements:', error.message);
    // Si la tabla no existe, retornar array vacío
    if (error.message.includes('no such table')) {
      return [];
    }
    throw error;
  }
}

/**
 * Obtiene el progreso hacia badges no desbloqueados
 */
function getBadgeProgress(db, userId, tenantId) {
  try {
    const stats = getPaymentStats(db, tenantId);
    const existingBadges = db.prepare(`
      SELECT badge_type FROM achievements WHERE user_id = ?
    `).all(userId);
    const unlockedTypes = new Set(existingBadges.map(b => b.badge_type));

    const progress = [];

    for (const [key, badge] of Object.entries(BADGE_TYPES)) {
      if (unlockedTypes.has(badge.id)) continue;

      let currentProgress = 0;
      let totalRequired = 0;

      // Calcular progreso específico por badge
      switch (badge.id) {
        case 'first_recovery':
          currentProgress = stats.recovered;
          totalRequired = 1;
          break;
        case 'milestone_10':
          currentProgress = stats.recovered;
        totalRequired = 10;
        break;
      case 'milestone_50':
        currentProgress = stats.recovered;
        totalRequired = 50;
        break;
      case 'perfect_rate':
        currentProgress = stats.total > 0 ? (stats.recovered / stats.total) * 100 : 0;
        totalRequired = 100;
        break;
      case 'speed_demon':
        currentProgress = stats.fastest_recovery ? 1 : 0;
        totalRequired = 1;
        break;
    }

    progress.push({
      badge_type: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      current: currentProgress,
      required: totalRequired,
      percentage: totalRequired > 0 ? Math.min(100, (currentProgress / totalRequired) * 100) : 0,
      locked: true
    });
  }

  return progress;
  } catch (error) {
    console.error('Error obteniendo progreso de badges:', error.message);
    // Si la tabla no existe, retornar array vacío
    if (error.message.includes('no such table')) {
      return [];
    }
    throw error;
  }
}

module.exports = {
  BADGE_TYPES,
  checkAndUnlockAchievements,
  getUserAchievements,
  getBadgeProgress,
  getPaymentStats
};
