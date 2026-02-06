import { useState, useEffect } from 'react';
import { Bell, User, Heart, MessageCircle, Info } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NotificationsProps {
  user: any;
}

export function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user.username]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/get-notifications/${user.username}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
    setLoading(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} дн назад`;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
        <h1 className="text-3xl font-bold mb-8">Уведомления</h1>
        <div className="text-center text-gray-500 py-8">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-3xl font-bold mb-8">Уведомления</h1>

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>У вас пока нет уведомлений</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border transition ${
                notif.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(notif.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System notifications info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
        <p className="font-semibold mb-2">Типы уведомлений:</p>
        <ul className="space-y-1 text-xs">
          <li>• Системные уведомления о новых сессиях входа</li>
          <li>• Уведомления о подписках</li>
          <li>• Уведомления о лайках и комментариях</li>
          <li>• Уведомления от администрации</li>
        </ul>
      </div>
    </div>
  );
}
