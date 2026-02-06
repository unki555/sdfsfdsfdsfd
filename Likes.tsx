import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LikesProps {
  user: any;
  onViewProfile: (username: string) => void;
}

export function Likes({ user, onViewProfile }: LikesProps) {
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLikedPosts();
  }, [user.username]);

  const loadLikedPosts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/get-posts`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      
      // Filter posts that the user has liked
      const liked = data.posts.filter((post: any) => 
        post.likes && post.likes.includes(user.username)
      );
      
      setLikedPosts(liked);
    } catch (err) {
      console.error('Failed to load liked posts:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
        <h1 className="text-3xl font-bold mb-8">Отметки "Нравится"</h1>
        <div className="text-center text-gray-500 py-8">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-3xl font-bold mb-8">Отметки "Нравится"</h1>

      {likedPosts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Вы еще ничего не лайкнули</p>
        </div>
      ) : (
        <div className="space-y-0">
          {likedPosts.map((post, index) => (
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
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">{post.content}</p>
                    
                    {post.media && post.media.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
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

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        {post.likes?.length || 0}
                      </span>
                      <span>{post.comments?.length || 0} комментариев</span>
                    </div>
                  </div>
                </div>
              </div>
              {index < likedPosts.length - 1 && (
                <div className="border-b border-gray-200" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}