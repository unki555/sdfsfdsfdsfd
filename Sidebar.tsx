import { Home, User, MessageCircle, Bell, Heart, Video, Music, Settings, Info, Shield, Search } from 'lucide-react';

interface SidebarProps {
  user: any;
  currentView: string;
  onNavigate: (view: any) => void;
  onSearch: () => void;
}

export function Sidebar({ user, currentView, onNavigate, onSearch }: SidebarProps) {
  const menuItems = [
    { id: 'profile', label: 'Мой профиль', icon: User },
    { id: 'feed', label: 'Главная', icon: Home },
    { id: 'chats', label: 'Чаты', icon: MessageCircle },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'likes', label: 'Отметки нравится', icon: Heart },
    { id: 'clips', label: 'Sphere клипы', icon: Video },
    { id: 'music', label: 'Музыка', icon: Music },
    { id: 'settings', label: 'Настройки', icon: Settings },
    { id: 'about', label: 'О приложении', icon: Info },
  ];

  if (user.isAdmin) {
    menuItems.push({ id: 'admin', label: 'Админ панель', icon: Shield });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-gray-200" style={{ marginLeft: '65px' }}>
        {/* User Banner */}
        <div className="h-32 relative">
          {user.banner ? (
            <img src={user.banner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden border-2 border-white">
                  {user.avatar && (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-white font-semibold text-sm truncate">
                    {user.firstName || user.username}
                  </p>
                  {user.isVerified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-white/80 text-xs truncate">@{user.username}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={onSearch}
          className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm font-medium">Поиск</span>
        </button>

        {/* Menu Items */}
        <nav className="py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition text-sm ${
                  isActive 
                    ? 'bg-black text-white font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          <button onClick={() => onNavigate('feed')} className={`p-2 ${currentView === 'feed' ? 'text-black' : 'text-gray-400'}`}>
            <Home className="w-5 h-5" />
          </button>
          <button onClick={onSearch} className={`p-2 ${currentView === 'search' ? 'text-black' : 'text-gray-400'}`}>
            <Search className="w-5 h-5" />
          </button>
          <button onClick={() => onNavigate('clips')} className={`p-2 ${currentView === 'clips' ? 'text-black' : 'text-gray-400'}`}>
            <Video className="w-5 h-5" />
          </button>
          <button onClick={() => onNavigate('notifications')} className={`p-2 ${currentView === 'notifications' ? 'text-black' : 'text-gray-400'}`}>
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => onNavigate('profile')} className={`p-2 ${currentView === 'profile' ? 'text-black' : 'text-gray-400'}`}>
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
