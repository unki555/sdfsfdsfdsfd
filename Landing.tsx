interface LandingProps {
  onNavigateToAuth: () => void;
}

export function Landing({ onNavigateToAuth }: LandingProps) {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sphere</h1>
          <button
            onClick={onNavigateToAuth}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Веб версия
          </button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl font-bold mb-6">
            Добро пожаловать в Sphere
          </h2>
          <p className="text-2xl text-gray-600 mb-12">
            Новая социальная сеть для общения, обмена контентом и музыкой
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6">
              <div className="w-16 h-16 bg-black rounded-2xl mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Общение</h3>
              <p className="text-gray-600">
                Обменивайтесь сообщениями, фото и видео с друзьями
              </p>
            </div>

            <div className="p-6">
              <div className="w-16 h-16 bg-black rounded-2xl mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Контент</h3>
              <p className="text-gray-600">
                Делитесь постами, клипами и музыкой с сообществом
              </p>
            </div>

            <div className="p-6">
              <div className="w-16 h-16 bg-black rounded-2xl mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Музыка</h3>
              <p className="text-gray-600">
                Загружайте треки и слушайте музыку других пользователей
              </p>
            </div>
          </div>

          <div className="mt-20">
            <h3 className="text-3xl font-bold mb-6">Как использовать Sphere</h3>
            <div className="text-left max-w-2xl mx-auto space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold mb-2">1. Создайте аккаунт</h4>
                <p className="text-gray-600">
                  Зарегистрируйтесь, указав имя пользователя, email и загрузив аватар
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold mb-2">2. Настройте профиль</h4>
                <p className="text-gray-600">
                  Добавьте баннер, заполните информацию о себе
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold mb-2">3. Начните общаться</h4>
                <p className="text-gray-600">
                  Публикуйте посты, загружайте клипы и музыку, общайтесь с друзьями
                </p>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-20 border-t border-gray-200">
            <div className="text-sm text-gray-500 space-x-6">
              <a href="#" className="hover:text-black">Пользовательское соглашение</a>
              <a href="#" className="hover:text-black">Условия пользования</a>
              <a href="#" className="hover:text-black">О ��риложении</a>
            </div>
            <p className="mt-4 text-gray-400">© 2026 Sphere. Все права защищены.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
