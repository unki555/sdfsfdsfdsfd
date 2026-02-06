import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Repeat, Image as ImageIcon, Video, Music, Send } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FeedProps {
  currentUser: any;
  onViewProfile: (username: string) => void;
}

export function Feed({ currentUser, onViewProfile }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/get-posts`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostMedia.length === 0) return;

    setUploading(true);

    try {
      const mediaUrls = [];
      
      for (const file of newPostMedia) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('username', currentUser.username);
        formData.append('type', 'post');

        const uploadRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          body: formData
        });

        const uploadData = await uploadRes.json();
        mediaUrls.push({
          url: uploadData.url,
          type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image'
        });
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/create-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: currentUser.username,
          content: newPostContent,
          media: mediaUrls
        })
      });

      const data = await response.json();
      if (data.post) {
        setPosts([data.post, ...posts]);
        setNewPostContent('');
        setNewPostMedia([]);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/like-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          postId,
          username: currentUser.username
        })
      });

      const data = await response.json();
      if (data.post) {
        setPosts(posts.map(p => p.id === postId ? data.post : p));
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/add-comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          postId,
          username: currentUser.username,
          content
        })
      });

      const data = await response.json();
      if (data.post) {
        setPosts(posts.map(p => p.id === postId ? data.post : p));
        setCommentInputs({ ...commentInputs, [postId]: '' });
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  if (loading) {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-8">
      {/* Create Post */}
      <div className="bg-white border-b border-gray-200 p-4 md:p-6">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Что нового?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
          rows={3}
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewPostMedia([...newPostMedia, ...Array.from(e.target.files || [])])}
                className="hidden"
              />
            </label>
            <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition">
              <Video className="w-5 h-5 text-gray-600" />
              <input
                type="file"
                accept="video/*"
                onChange={(e) => e.target.files?.[0] && setNewPostMedia([...newPostMedia, e.target.files[0]])}
                className="hidden"
              />
            </label>
            <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition">
              <Music className="w-5 h-5 text-gray-600" />
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => e.target.files?.[0] && setNewPostMedia([...newPostMedia, e.target.files[0]])}
                className="hidden"
              />
            </label>
          </div>
          
          <button
            onClick={handleCreatePost}
            disabled={uploading || (!newPostContent.trim() && newPostMedia.length === 0)}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 text-sm"
          >
            {uploading ? 'Загрузка...' : 'Опубликовать'}
          </button>
        </div>

        {newPostMedia.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {newPostMedia.map((file, index) => (
              <div key={index} className="relative">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-xs">
                  {file.name}
                </div>
                <button
                  onClick={() => setNewPostMedia(newPostMedia.filter((_, i) => i !== index))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      <div>
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-200 p-4 md:p-6">
            <div className="flex gap-3 mb-3">
              <div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 flex-shrink-0 cursor-pointer overflow-hidden"
                onClick={() => onViewProfile(post.author)}
              >
                {/* Avatar will be loaded from user data */}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onViewProfile(post.author)}
                    className="font-bold text-sm md:text-base hover:underline"
                  >
                    {post.author}
                  </button>
                  <span className="text-gray-500 text-xs md:text-sm">
                    {new Date(post.timestamp).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p className="mt-2 text-sm md:text-base whitespace-pre-wrap">{post.content}</p>

                {post.media && post.media.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {post.media.map((media: any, index: number) => (
                      <div key={index} className="rounded-lg overflow-hidden">
                        {media.type === 'image' && (
                          <img src={media.url} alt="Post media" className="w-full h-auto" />
                        )}
                        {media.type === 'video' && (
                          <video src={media.url} controls className="w-full h-auto" />
                        )}
                        {media.type === 'audio' && (
                          <audio src={media.url} controls className="w-full" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-6 mt-4 text-gray-600">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 hover:text-red-600 transition text-sm ${
                      post.likes?.includes(currentUser.username) ? 'text-red-600' : ''
                    }`}
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${post.likes?.includes(currentUser.username) ? 'fill-current' : ''}`} />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 hover:text-blue-600 transition text-sm"
                  >
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 hover:text-green-600 transition text-sm">
                    <Repeat className="w-4 h-4 md:w-5 md:h-5" />
                    <span>{post.reposts?.length || 0}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedComments.has(post.id) && (
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Написать комментарий..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                        {post.comments.map((comment: any) => (
                          <div key={comment.id} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <button 
                                onClick={() => onViewProfile(comment.author)}
                                className="font-bold hover:underline"
                              >
                                {comment.author}
                              </button>
                              <span className="text-gray-500 text-xs">
                                {new Date(comment.timestamp).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>Пока нет постов. Будьте первым!</p>
          </div>
        )}
      </div>
    </div>
  );
}
