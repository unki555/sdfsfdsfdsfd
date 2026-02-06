import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AuthProps {
  onLogin: (user: any, isNewUser: boolean) => void;
  onBack: () => void;
}

type AuthMode = 'login' | 'register';
type RegisterStep = 'username' | 'name' | 'email' | 'avatar' | 'banner' | 'password';

export function Auth({ onLogin, onBack }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaAnswer] = useState(Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10));

  // Register state
  const [registerStep, setRegisterStep] = useState<RegisterStep>('username');
  const [registerData, setRegisterData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    avatar: null as File | null,
    avatarPreview: '',
    banner: null as File | null,
    bannerPreview: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parseInt(captcha) !== captchaAnswer) {
      setError('Неверная капча');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка входа');
        setLoading(false);
        return;
      }

      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('username', data.user.username);
      onLogin(data.user, false);
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  const handleFileSelect = (field: 'avatar' | 'banner', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setRegisterData(prev => ({
        ...prev,
        [field]: file,
        [`${field}Preview`]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterNext = () => {
    const steps: RegisterStep[] = ['username', 'name', 'email', 'avatar', 'banner', 'password'];
    const currentIndex = steps.indexOf(registerStep);
    
    if (currentIndex < steps.length - 1) {
      setRegisterStep(steps[currentIndex + 1]);
    }
  };

  const handleRegisterBack = () => {
    const steps: RegisterStep[] = ['username', 'name', 'email', 'avatar', 'banner', 'password'];
    const currentIndex = steps.indexOf(registerStep);
    
    if (currentIndex > 0) {
      setRegisterStep(steps[currentIndex - 1]);
    }
  };

  const handleRegisterSubmit = async () => {
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      // Upload avatar
      let avatarUrl = '';
      if (registerData.avatar) {
        const avatarFormData = new FormData();
        avatarFormData.append('file', registerData.avatar);
        avatarFormData.append('username', registerData.username);
        avatarFormData.append('type', 'avatar');

        const uploadRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          body: avatarFormData
        });

        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.url;
      }

      // Upload banner
      let bannerUrl = '';
      if (registerData.banner) {
        const bannerFormData = new FormData();
        bannerFormData.append('file', registerData.banner);
        bannerFormData.append('username', registerData.username);
        bannerFormData.append('type', 'banner');

        const uploadRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          body: bannerFormData
        });

        const uploadData = await uploadRes.json();
        bannerUrl = uploadData.url;
      }

      // Register user
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          avatar: avatarUrl,
          banner: bannerUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка регистрации');
        setLoading(false);
        return;
      }

      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('username', data.user.username);
      onLogin(data.user, true);
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0 blur-3xl"
          style={{
            background: 'radial-gradient(circle at 20% 50%, #000 0%, transparent 50%), radial-gradient(circle at 80% 50%, #000 0%, transparent 50%)'
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {mode === 'login' ? (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Sphere</h1>
                <p className="text-gray-600">Войдите в свой аккаунт</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Капча: Сколько будет {Math.floor(captchaAnswer / 2)} + {captchaAnswer - Math.floor(captchaAnswer / 2)}?
                  </label>
                  <input
                    type="number"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {loading ? 'Загрузка...' : 'Войти'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    Нет аккаунта? Зарегистрироваться
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    ← Назад на главную
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Регистрация</h1>
                <p className="text-gray-600">Создайте свой аккаунт в Sphere</p>
              </div>

              <div className="space-y-4">
                {registerStep === 'username' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Шаг 1: Username
                      <span className="block text-xs text-gray-500 mt-1">
                        Придумайте уникальное имя пользователя для входа в систему
                      </span>
                    </label>
                    <input
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="username"
                    />
                  </div>
                )}

                {registerStep === 'name' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Шаг 2: Имя и Фамилия
                      <span className="block text-xs text-gray-500 mt-1">
                        Укажите ваше настоящее имя (необязательно)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black mb-3"
                      placeholder="Имя"
                    />
                    <input
                      type="text"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Фамилия"
                    />
                  </div>
                )}

                {registerStep === 'email' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Шаг 3: Email
                      <span className="block text-xs text-gray-500 mt-1">
                        Укажите вашу электронную почту для восстановления доступа
                      </span>
                    </label>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="email@example.com"
                    />
                  </div>
                )}

                {registerStep === 'avatar' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Шаг 4: Аватар
                      <span className="block text-xs text-gray-500 mt-1">
                        Загрузите фотографию профиля из вашей галереи
                      </span>
                    </label>
                    {registerData.avatarPreview && (
                      <div className="mb-4">
                        <img 
                          src={registerData.avatarPreview} 
                          alt="Preview" 
                          className="w-32 h-32 rounded-full object-cover mx-auto"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect('avatar', e.target.files[0])}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}

                {registerStep === 'banner' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Шаг 5: Баннер
                      <span className="block text-xs text-gray-500 mt-1">
                        Загрузите баннер для вашего профиля из галереи
                      </span>
                    </label>
                    {registerData.bannerPreview && (
                      <div className="mb-4">
                        <img 
                          src={registerData.bannerPreview} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect('banner', e.target.files[0])}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}

                {registerStep === 'password' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Шаг 6: Пароль
                      <span className="block text-xs text-gray-500 mt-1">
                        Придумайте надежный пароль для защиты вашего аккаунта
                      </span>
                    </label>
                    <input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black mb-3"
                      placeholder="Пароль"
                    />
                    <input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Повторите пароль"
                    />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  {registerStep !== 'username' && (
                    <button
                      onClick={handleRegisterBack}
                      className="flex-1 bg-gray-200 text-black py-3 rounded-lg hover:bg-gray-300 transition"
                    >
                      Назад
                    </button>
                  )}
                  
                  {registerStep !== 'password' ? (
                    <button
                      onClick={handleRegisterNext}
                      className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                      Далее
                    </button>
                  ) : (
                    <button
                      onClick={handleRegisterSubmit}
                      disabled={loading}
                      className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      {loading ? 'Регистрация...' : 'Завершить регистрацию'}
                    </button>
                  )}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setMode('login')}
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    Уже есть аккаунт? Войти
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
