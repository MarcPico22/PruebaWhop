import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BadgeDisplay() {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [] });
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const { width, height } = useWindowSize();

  useEffect(() => {
    fetchAchievements();
    
    // Polling cada 30 segundos para detectar nuevos badges
    const interval = setInterval(checkNewBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/achievements/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAchievements({
        unlocked: response.data.unlocked || [],
        locked: response.data.locked || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setLoading(false);
    }
  };

  const checkNewBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/achievements/check`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.new_badges && response.data.new_badges.length > 0) {
        // Nuevo badge desbloqueado!
        const badge = response.data.new_badges[0];
        setNewBadge(badge);
        setShowConfetti(true);

        // Detener confetti después de 5 segundos
        setTimeout(() => {
          setShowConfetti(false);
          setNewBadge(null);
        }, 5000);

        // Actualizar lista
        fetchAchievements();
      }
    } catch (error) {
      console.error('Error checking new badges:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allBadges = [...achievements.unlocked, ...achievements.locked];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Confetti */}
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      {/* New Badge Notification */}
      {newBadge && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-2xl p-6 max-w-sm animate-bounce">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{newBadge.icon}</div>
            <div>
              <div className="font-bold text-lg">{t('badges.notification.title')}</div>
              <div className="text-sm opacity-90">{newBadge.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-3xl mr-3">🏆</span>
            {t('dashboard.achievements.title')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {achievements.unlocked.length} {t('badges.progress.of')} {allBadges.length} {t('badges.progress.unlocked')}
          </p>
        </div>
        <button
          onClick={checkNewBadges}
          className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          🔄 {t('badges.buttons.checkNew')}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{t('badges.progress.label')}</span>
          <span>{Math.round((achievements.unlocked.length / allBadges.length) * 100)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
            style={{ width: `${(achievements.unlocked.length / allBadges.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Unlocked Badges */}
        {achievements.unlocked.map((badge) => (
          <div
            key={badge.id}
            className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 text-center hover:shadow-lg transition-all cursor-pointer border-2 border-indigo-200"
          >
            <div className="text-5xl mb-2 animate-pulse">{badge.icon}</div>
            <div className="font-semibold text-gray-900 text-sm">{badge.name}</div>
            <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                {t('badges.tooltip.unlocked')} {new Date(badge.unlocked_at * 1000).toLocaleDateString()}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        ))}

        {/* Locked Badges */}
        {achievements.locked.map((badge) => (
          <div
            key={badge.badge_type}
            className="group relative bg-gray-100 rounded-lg p-4 text-center opacity-60 hover:opacity-80 transition-all cursor-help border-2 border-gray-300 border-dashed"
          >
            <div className="text-5xl mb-2 filter grayscale">{badge.icon}</div>
            <div className="font-semibold text-gray-700 text-sm">{badge.name}</div>
            <div className="text-xs text-gray-500 mt-1">{badge.description}</div>
            
            {/* Progress indicator */}
            {badge.percentage > 0 && (
              <div className="mt-3">
                <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${badge.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {Math.round(badge.current)} / {badge.required}
                </div>
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                🔒 {t('badges.tooltip.locked')} - {badge.required - badge.current} {t('badges.tooltip.moreToUnlock')}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {allBadges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🎖️</div>
          <p>{t('badges.empty')}</p>
        </div>
      )}
    </div>
  );
}
