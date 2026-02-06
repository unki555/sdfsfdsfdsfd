import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SettingsProps {
  user: any;
  onLogout: () => void;
  onRefresh: () => void;
}

export function Settings({ user, onLogout, onRefresh }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || ''
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', user.username);
      formData.append('type', 'avatar');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        body: formData
      });

      const data = await response.json();
      
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: user.username,
          updates: { avatar: data.url }
        })
      });

      setMessage('Аватар обновлен');
      onRefresh();
    } catch (err) {
      setMessage('Ошибка загрузки аватара');
    }
    setLoading(false);
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', user.username);
      formData.append('type', 'banner');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        body: formData
      });

      const data = await response.json();
      
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: user.username,
          updates: { banner: data.url }
        })
      });

      setMessage('Баннер обновлен');
      onRefresh();
    } catch (err) {
      setMessage('Ошибка загрузки баннера');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: user.username,
          updates: formData
        })
      });

      setMessage('Профиль обновлен');
      onRefresh();
    } catch (err) {
      setMessage('Ошибка обновления профиля');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-3xl font-bold mb-8">Настройки</h1>

      <div className="space-y-8">
        {/* Avatar */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Аватар</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
              {user.avatar && (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              )}
            </div>
            <label className="bg-black text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition text-sm">
              Загрузить новый аватар
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Banner */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Баннер</h2>
          <div className="space-y-4">
            {user.banner && (
              <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-200">
                <img src={user.banner} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="bg-black text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition text-sm inline-block">
              Загрузить новый баннер
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Profile Info */}
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold mb-4">Информация профиля</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Имя</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Фамилия</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">О себе</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Местоположение</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Веб-сайт</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>

        {message && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Logout */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Выход</h2>
          <button
            onClick={onLogout}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition text-sm"
          >
            Выйти из аккаунта
          </button>
        </div>

        {/* Legal */}
        <div className="text-center text-sm text-gray-500 space-y-2 pt-8">
          <div>
            <a href="#" className="hover:text-black">Пользовательское согл��шение</a>
            {' · '}
            <a href="#" className="hover:text-black">Условия пользования</a>
          </div>
          <p>© 2026 Sphere. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
