import { useState, useEffect } from 'react';
import { Search, Users, TrendingUp, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AdminPanelProps {
  currentUser: any;
}

export function AdminPanel({ currentUser }: AdminPanelProps) {
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/admin/stats`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/search?q=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleVerifyUser = async (username: string) => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/admin/verify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          adminUsername: currentUser.username,
          targetUsername: username
        })
      });
      setMessage(`Статус верификации пользователя ${username} изменен`);
      handleSearch();
    } catch (err) {
      setMessage('Ошибка изменения верификации');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
      return;
    }

    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          adminUsername: currentUser.username,
          targetUsername: username
        })
      });
      setMessage(`Пользователь ${username} удален`);
      handleSearch();
      loadStats();
    } catch (err) {
      setMessage('Ошибка удаления пользователя');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;

    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          adminUsername: currentUser.username,
          message: broadcastMessage
        })
      });
      setMessage('Рассылка отправлена всем пользователям');
      setBroadcastMessage('');
    } catch (err) {
      setMessage('Ошибка отправки рассылки');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Админ панель</h1>
      </div>

      {message && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm">
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-xl">
          <Users className="w-6 h-6 mb-2 text-gray-600" />
          <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-gray-600">Всего пользователей</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl">
          <TrendingUp className="w-6 h-6 mb-2 text-gray-600" />
          <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
          <p className="text-xs text-gray-600">Всего постов</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl">
          <TrendingUp className="w-6 h-6 mb-2 text-gray-600" />
          <p className="text-2xl font-bold">{stats?.totalClips || 0}</p>
          <p className="text-xs text-gray-600">Всего клипов</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl">
          <TrendingUp className="w-6 h-6 mb-2 text-gray-600" />
          <p className="text-2xl font-bold">{stats?.onlineUsers || 0}</p>
          <p className="text-xs text-gray-600">Онлайн</p>
        </div>
      </div>

      {/* Search Users */}
      <div className="bg-gray-50 p-6 rounded-xl mb-8">
        <h2 className="text-lg font-semibold mb-4">Поиск пользователей</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Введите username..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
          />
          <button
            onClick={handleSearch}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition text-sm"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div key={user.username} className="bg-white p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {user.avatar && (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-sm">{user.firstName || user.username}</p>
                      {user.isVerified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">@{user.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyUser(user.username)}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      user.isVerified 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.isVerified ? 'Убрать галочку' : 'Выдать галочку'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.username)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Рассылка уведомлений</h2>
        <textarea
          value={broadcastMessage}
          onChange={(e) => setBroadcastMessage(e.target.value)}
          placeholder="Введите сообщение для рассылки всем пользователям..."
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black mb-4 text-sm"
        />
        <button
          onClick={handleBroadcast}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition text-sm"
        >
          Отправить всем
        </button>
      </div>
    </div>
  );
}
