import { useState, useEffect } from 'react';
import { Mail, MapPin, Link as LinkIcon, Calendar, Edit, Heart, MessageCircle, Repeat } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ProfileProps {
  user: any;
  isOwnProfile: boolean;
  onRefresh: () => void;
}

export function Profile({ user: initialUser, isOwnProfile, onRefresh }: ProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    website: '',
    bio: ''
  });

  useEffect(() => {
    loadUser();
    loadUserPosts();
  }, [initialUser]);

  const loadUser = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/get-user/${initialUser.username}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        setEditData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          location: data.user.location || '',
          website: data.user.website || '',
          bio: data.user.bio || ''
        });
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/get-user-posts/${initialUser.username}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: user.username,
          updates: editData
        })
      });

      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        setEditing(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center">Пользователь не найден</div>;
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-8">
      {/* Banner */}
      <div className="h-48 md:h-64 relative bg-gradient-to-br from-gray-100 to-gray-200">
        {user.banner && (
          <img src={user.banner} alt="Banner" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="relative -mt-16 md:-mt-20 mb-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-300 border-4 border-white overflow-hidden">
            {user.avatar && (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold">
                {user.firstName || user.username} {user.lastName || ''}
              </h1>
              {user.isVerified && (
                <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-3 h-3 md:w-4 md:h-4">
                    <path d="M13 4L6 11L3 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
            <p className="text-gray-500">@{user.username}</p>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm"
            >
              <Edit className="w-4 h-4" />
              {editing ? 'Отмена' : 'Редактировать профиль'}
            </button>
          )}
        </div>

        {editing ? (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Имя</label>
                <input
                  type="text"
                  value={editData.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Фамилия</label>
                <input
                  type="text"
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Местоположение</label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Сайт</label>
              <input
                type="url"
                value={editData.website}
                onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">О себе</label>
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="w-full md:w-auto bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition text-sm"
            >
              Сохранить изменения
            </button>
          </div>
        ) : (
          <>
            {user.bio && (
              <p className="text-gray-700 mb-4 text-sm md:text-base">{user.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
              {user.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {user.website}
                  </a>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Регистрация: {new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Stats */}
        <div className="flex gap-6 md:gap-8 py-6 border-t border-b border-gray-200 mb-8">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">{user.following?.length || 0}</div>
            <div className="text-xs md:text-sm text-gray-600">Подписки</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">{user.followers?.length || 0}</div>
            <div className="text-xs md:text-sm text-gray-600">Подписчики</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">{posts.length}</div>
            <div className="text-xs md:text-sm text-gray-600">Посты</div>
          </div>
        </div>

        {/* Posts */}
        <div>
          <h2 className="text-xl font-bold mb-4">Посты</h2>
          {posts.length === 0 ? (
            <div className="text-center text-gray-500 py-12 text-sm">
              <p>Пока нет постов</p>
            </div>
          ) : (
            <div className="space-y-0">
              {posts.map((post, index) => (
                <div key={post.id}>
                  <div className="py-4">
                    <p className="text-sm md:text-base whitespace-pre-wrap break-words mb-3">{post.content}</p>
                    
                    {post.media && post.media.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {post.media.map((media: any, idx: number) => (
                          <div key={idx} className="rounded-lg overflow-hidden bg-gray-100">
                            {media.type === 'video' ? (
                              <video src={media.url} className="w-full" controls />
                            ) : media.type === 'audio' ? (
                              <audio src={media.url} className="w-full" controls />
                            ) : (
                              <img src={media.url} alt="" className="w-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-6 text-gray-600 text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4" />
                        <span>{post.reposts?.length || 0}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(post.timestamp).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  {index < posts.length - 1 && (
                    <div className="border-b border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}