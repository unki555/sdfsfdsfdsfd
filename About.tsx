export function About() {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-3xl font-bold mb-8">О приложении</h1>

      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">Sphere</h2>
          <p className="text-sm text-gray-600 mb-4">Версия 1.0.0</p>
          <p className="text-sm">
            Sphere - современная социальная сеть для общения, обмена контентом и музыкой.
            Здесь вы можете публиковать посты, загружать видео-клипы, делиться музыкой
            и общаться с друзьями.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Основные возможности</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span>Публикация постов с фото и видео</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span>Видео-клипы в стиле коротких вертикальных видео</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span>Загрузка и прослушивание музыкальных треков</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span>Система подписок и лайков</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span>Комментарии к постам и клипам</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span>Уведомления о новых событиях</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span>Глобальный поиск пользователей и контента</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span>Настройка профиля с аватаром и баннером</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Техническая информация</h2>
          <div className="text-sm space-y-2">
            <p><strong>Платформа:</strong> Web-приложение</p>
            <p><strong>Технологии:</strong> React, TypeScript, Tailwind CSS</p>
            <p><strong>Backend:</strong> Deno Edge Functions</p>
            <p><strong>Хранилище:</strong> Key-Value Store</p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Правовая информация</h2>
          <div className="space-y-3 text-sm">
            <a href="#" className="block text-blue-600 hover:underline">
              Пользовательское соглашение
            </a>
            <a href="#" className="block text-blue-600 hover:underline">
              Политика конфиденциальности
            </a>
            <a href="#" className="block text-blue-600 hover:underline">
              Условия использования
            </a>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Поддержка</h2>
          <p className="text-sm text-gray-600">
            По вопросам работы приложения и технической поддержки обращайтесь
            к администрации через систему уведомлений.
          </p>
        </div>

        <div className="text-center text-sm text-gray-500 pt-4">
          <p>© 2026 Sphere. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
