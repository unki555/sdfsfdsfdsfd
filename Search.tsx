import { useState } from 'react';
import { Search as SearchIcon, User, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SearchProps {
  currentUser: any;
  onViewProfile: (username: string) => void;
}

export function Search({ currentUser, onViewProfile }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/search?q=${encodeURIComponent(query)}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-3xl font-bold mb-8">Глобальный поиск</h1>

      <div className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Поиск пользователей и постов..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Поиск...</div>
      ) : searched ? (
        <div className="space-y-8">
          {/* Users */}
          {results.users && results.users.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Пользователи</h2>
              </div>
              <div className="space-y-2">
                {results.users.map((user) => (
                  <button
                    key={user.username}
                    onClick={() => onViewProfile(user.username)}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center gap-3 transition text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {user.avatar && (
                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-sm truncate">
                          {user.firstName || user.username}
                        </p>
                        {user.isVerified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{user.bio}</p>
                      )}
                    </div>
                    {user.isOnline && (
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {results.posts && results.posts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Посты</h2>
              </div>
              <div className="space-y-0">
                {results.posts.map((post, index) => (
                  <div key={post.id}>
                    <div className="py-4">
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => onViewProfile(post.author)}
                          className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
                        >
                          {post.authorAvatar && (
                            <img src={post.authorAvatar} alt={post.author} className="w-full h-full object-cover" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <button 
                            onClick={() => onViewProfile(post.author)}
                            className="font-semibold hover:underline text-sm"
                          >
                            {post.author}
                          </button>
                          <p className="text-sm mt-1 whitespace-pre-wrap break-words line-clamp-3">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{post.likes?.length || 0} лайков</span>
                            <span>{post.comments?.length || 0} комментариев</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < results.posts.length - 1 && (
                      <div className="border-b border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {results.users.length === 0 && results.posts.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Ничего не найдено по запросу "{query}"</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Введите запрос для поиска</p>
        </div>
      )}
    </div>
  );
}
