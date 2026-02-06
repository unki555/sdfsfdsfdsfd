import { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Auth } from './components/Auth';
import { MainApp } from './components/MainApp';

type View = 'landing' | 'auth' | 'app' | 'welcome';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Проверяем сессию при загрузке
    const sessionToken = localStorage.getItem('sessionToken');
    const username = localStorage.getItem('username');
    
    if (sessionToken && username) {
      fetch(`/api/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, username })
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setUser(data.user);
          setView('app');
        }
      })
      .catch(() => {});
    }
  }, []);

  const handleLogin = (userData: any, isNewUser: boolean) => {
    setUser(userData);
    if (isNewUser) {
      setShowWelcome(true);
      setView('welcome');
    } else {
      setView('app');
    }
  };

  const handleWelcomeContinue = () => {
    setShowWelcome(false);
    setView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('username');
    setUser(null);
    setView('landing');
  };

  if (view === 'welcome' && showWelcome) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-6 overflow-hidden">
            {user?.avatar && (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2">Добро пожаловать, {user?.username}!</h1>
          <p className="text-gray-600 mb-8">Нажмите кнопку продолжить.</p>
          <button
            onClick={handleWelcomeContinue}
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Продолжить
          </button>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return <Landing onNavigateToAuth={() => setView('auth')} />;
  }

  if (view === 'auth') {
    return <Auth onLogin={handleLogin} onBack={() => setView('landing')} />;
  }

  if (view === 'app' && user) {
    return <MainApp user={user} onLogout={handleLogout} />;
  }

  return null;
}
