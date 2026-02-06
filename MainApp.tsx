import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Profile } from './Profile';
import { Feed } from './Feed';
import { Clips } from './Clips';
import { Music } from './Music';
import { Settings } from './Settings';
import { AdminPanel } from './AdminPanel';
import { Notifications } from './Notifications';
import { Likes } from './Likes';
import { About } from './About';
import { Search } from './Search';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface MainAppProps {
  user: any;
  onLogout: () => void;
}

type View = 'profile' | 'feed' | 'chats' | 'notifications' | 'likes' | 'clips' | 'music' | 'settings' | 'about' | 'admin' | 'search' | 'user-profile';

export function MainApp({ user: initialUser, onLogout }: MainAppProps) {
  const [view, setView] = useState<View>('feed');
  const [user, setUser] = useState(initialUser);
  const [viewingUser, setViewingUser] = useState<any>(null);

  useEffect(() => {
    // Update online status
    const updateOnlineStatus = async () => {
      try {
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/update-online`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            username: user.username,
            isOnline: true
          })
        });
      } catch (err) {
        console.error('Failed to update online status:', err);
      }
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
      // Set offline when component unmounts
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/update-online`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: user.username,
          isOnline: false
        })
      });
    };
  }, [user.username]);

  const refreshUser = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/get-user/${user.username}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const handleViewUserProfile = (username: string) => {
    setViewingUser({ username });
    setView('user-profile');
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar 
        user={user} 
        currentView={view} 
        onNavigate={setView}
        onSearch={() => setView('search')}
      />

      {/* Main Content */}
      <div className="flex-1 md:ml-[280px]">
        {view === 'profile' && <Profile user={user} isOwnProfile={true} onRefresh={refreshUser} />}
        {view === 'feed' && <Feed currentUser={user} onViewProfile={handleViewUserProfile} />}
        {view === 'chats' && (
          <div className="p-8 text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-4">Чаты</h2>
            <p>Функционал в разработке</p>
          </div>
        )}
        {view === 'notifications' && <Notifications user={user} />}
        {view === 'likes' && <Likes user={user} onViewProfile={handleViewUserProfile} />}
        {view === 'clips' && <Clips currentUser={user} onViewProfile={handleViewUserProfile} />}
        {view === 'music' && <Music currentUser={user} />}
        {view === 'settings' && <Settings user={user} onLogout={onLogout} onRefresh={refreshUser} />}
        {view === 'about' && <About />}
        {view === 'admin' && user.isAdmin && <AdminPanel currentUser={user} />}
        {view === 'search' && <Search currentUser={user} onViewProfile={handleViewUserProfile} />}
        {view === 'user-profile' && viewingUser && (
          <Profile user={viewingUser} isOwnProfile={false} onRefresh={() => {}} />
        )}
      </div>
    </div>
  );
}
