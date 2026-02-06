import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Security middleware - Rate limiting
const loginAttempts = new Map<string, { count: number, blockedUntil?: number }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', logger(console.log));

// Helper functions
function hashPassword(password: string): string {
  // Simple hash for demo - in production use proper hashing
  return btoa(password);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function generateSessionToken(): string {
  return generateId() + generateId();
}

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate password strength
function validatePassword(password: string): { valid: boolean, error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Пароль должен быть минимум 6 символов' };
  }
  if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать буквы' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать цифры' };
  }
  return { valid: true };
}

// Check rate limit for login
function checkLoginRateLimit(username: string): { allowed: boolean, error?: string } {
  const now = Date.now();
  const attempt = loginAttempts.get(username);

  if (attempt && attempt.blockedUntil && now < attempt.blockedUntil) {
    const remainingMinutes = Math.ceil((attempt.blockedUntil - now) / 60000);
    return { 
      allowed: false, 
      error: `Слишком много попыток входа. Попробуйте через ${remainingMinutes} минут` 
    };
  }

  return { allowed: true };
}

function recordLoginAttempt(username: string, success: boolean) {
  const now = Date.now();
  const attempt = loginAttempts.get(username);

  if (success) {
    loginAttempts.delete(username);
    return;
  }

  if (!attempt) {
    loginAttempts.set(username, { count: 1 });
  } else {
    const newCount = attempt.count + 1;
    if (newCount >= 3) {
      loginAttempts.set(username, { 
        count: newCount, 
        blockedUntil: now + 15 * 60 * 1000 // 15 minutes
      });
    } else {
      loginAttempts.set(username, { count: newCount });
    }
  }
}

// Initialize admin user
async function initAdmin() {
  const adminExists = await kv.get('user:admin');
  if (!adminExists) {
    await kv.set('user:admin', {
      username: 'admin',
      password: hashPassword('admin123'),
      email: 'admin@sphere.com',
      firstName: 'Admin',
      lastName: 'User',
      avatar: '',
      banner: '',
      isAdmin: true,
      isVerified: true,
      isOnline: false,
      followers: [],
      following: [],
      posts: [],
      bio: 'Администратор Sphere',
      location: '',
      website: '',
      createdAt: Date.now()
    });
    console.log('Admin user created: admin/admin123');
  }
}

initAdmin();

// Auth routes
app.post('/make-server-b8070d95/register', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, email, firstName, lastName, avatar, banner } = body;

    // Check if user exists
    const existingUser = await kv.get(`user:${username}`);
    if (existingUser) {
      return c.json({ error: 'Пользователь уже существует' }, 400);
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.error }, 400);
    }

    // Create user
    const user = {
      username,
      password: hashPassword(password),
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      avatar: avatar || '',
      banner: banner || '',
      isAdmin: false,
      isVerified: false,
      isOnline: true,
      followers: [],
      following: [],
      posts: [],
      bio: '',
      location: '',
      website: '',
      createdAt: Date.now()
    };

    await kv.set(`user:${username}`, user);

    // Create session
    const sessionToken = generateSessionToken();
    await kv.set(`session:${sessionToken}`, {
      username,
      createdAt: Date.now()
    });

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword, sessionToken });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Ошибка регистрации: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    // Check rate limit
    const rateLimit = checkLoginRateLimit(username);
    if (!rateLimit.allowed) {
      return c.json({ error: rateLimit.error }, 401);
    }

    const user = await kv.get(`user:${username}`);
    if (!user || user.password !== hashPassword(password)) {
      recordLoginAttempt(username, false);
      return c.json({ error: 'Неверный логин или пароль' }, 401);
    }

    recordLoginAttempt(username, true);

    // Update online status
    user.isOnline = true;
    await kv.set(`user:${username}`, user);

    // Create session
    const sessionToken = generateSessionToken();
    await kv.set(`session:${sessionToken}`, {
      username,
      createdAt: Date.now()
    });

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword, sessionToken });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Ошибка входа: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/verify-session', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionToken, username } = body;

    const session = await kv.get(`session:${sessionToken}`);
    if (!session || session.username !== username) {
      return c.json({ valid: false }, 401);
    }

    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ valid: false }, 401);
    }

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ valid: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Session verification error:', error);
    return c.json({ valid: false }, 401);
  }
});

// User routes
app.post('/make-server-b8070d95/update-online', async (c) => {
  try {
    const body = await c.req.json();
    const { username, isOnline } = body;

    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }

    user.isOnline = isOnline;
    await kv.set(`user:${username}`, user);

    return c.json({ success: true });
  } catch (error) {
    console.error('Update online status error:', error);
    return c.json({ error: 'Ошибка обновления статуса: ' + error.message }, 500);
  }
});

app.get('/make-server-b8070d95/get-user/:username', async (c) => {
  try {
    const username = c.req.param('username');
    const user = await kv.get(`user:${username}`);
    
    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Ошибка получения пользователя: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/update-profile', async (c) => {
  try {
    const body = await c.req.json();
    const { username, updates } = body;

    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'bio', 'location', 'website', 'avatar', 'banner'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    }

    await kv.set(`user:${username}`, user);

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Ошибка обновления профиля: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/follow', async (c) => {
  try {
    const body = await c.req.json();
    const { follower, following } = body;

    const followerUser = await kv.get(`user:${follower}`);
    const followingUser = await kv.get(`user:${following}`);

    if (!followerUser || !followingUser) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }

    if (!followerUser.following.includes(following)) {
      followerUser.following.push(following);
      followingUser.followers.push(follower);

      await kv.set(`user:${follower}`, followerUser);
      await kv.set(`user:${following}`, followingUser);

      // Create notification
      const notifId = generateId();
      await kv.set(`notification:${following}:${notifId}`, {
        id: notifId,
        type: 'follow',
        from: follower,
        message: `${follower} подписался на вас`,
        timestamp: Date.now(),
        read: false
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Follow error:', error);
    return c.json({ error: 'Ошибка подписки: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/unfollow', async (c) => {
  try {
    const body = await c.req.json();
    const { follower, following } = body;

    const followerUser = await kv.get(`user:${follower}`);
    const followingUser = await kv.get(`user:${following}`);

    if (!followerUser || !followingUser) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }

    followerUser.following = followerUser.following.filter((u: string) => u !== following);
    followingUser.followers = followingUser.followers.filter((u: string) => u !== follower);

    await kv.set(`user:${follower}`, followerUser);
    await kv.set(`user:${following}`, followingUser);

    return c.json({ success: true });
  } catch (error) {
    console.error('Unfollow error:', error);
    return c.json({ error: 'Ошибка отписки: ' + error.message }, 500);
  }
});

// Post routes
app.post('/make-server-b8070d95/create-post', async (c) => {
  try {
    const body = await c.req.json();
    const { username, content, media } = body;

    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }

    const postId = generateId();
    const post = {
      id: postId,
      author: username,
      content,
      media: media || [],
      likes: [],
      comments: [],
      reposts: [],
      timestamp: Date.now()
    };

    await kv.set(`post:${postId}`, post);
    
    user.posts.push(postId);
    await kv.set(`user:${username}`, user);

    return c.json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    return c.json({ error: 'Ошибка создания поста: ' + error.message }, 500);
  }
});

app.get('/make-server-b8070d95/get-posts', async (c) => {
  try {
    const posts = await kv.getByPrefix('post:');
    const sortedPosts = posts.sort((a: any, b: any) => b.timestamp - a.timestamp);
    return c.json({ posts: sortedPosts });
  } catch (error) {
    console.error('Get posts error:', error);
    return c.json({ error: 'Ошибка получения постов: ' + error.message }, 500);
  }
});

app.get('/make-server-b8070d95/get-user-posts/:username', async (c) => {
  try {
    const username = c.req.param('username');
    const user = await kv.get(`user:${username}`);
    
    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }

    const posts = await Promise.all(
      user.posts.map((postId: string) => kv.get(`post:${postId}`))
    );

    const validPosts = posts.filter(p => p !== null);
    return c.json({ posts: validPosts });
  } catch (error) {
    console.error('Get user posts error:', error);
    return c.json({ error: 'Ошибка получения постов: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/like-post', async (c) => {
  try {
    const body = await c.req.json();
    const { postId, username } = body;

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Пост не найден' }, 404);
    }

    if (!post.likes.includes(username)) {
      post.likes.push(username);
      await kv.set(`post:${postId}`, post);

      // Create notification
      if (post.author !== username) {
        const notifId = generateId();
        await kv.set(`notification:${post.author}:${notifId}`, {
          id: notifId,
          type: 'like',
          from: username,
          postId,
          message: `${username} лайкнул ваш пост`,
          timestamp: Date.now(),
          read: false
        });
      }
    }

    return c.json({ post });
  } catch (error) {
    console.error('Like post error:', error);
    return c.json({ error: 'Ошибка лайка: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/unlike-post', async (c) => {
  try {
    const body = await c.req.json();
    const { postId, username } = body;

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Пост не найден' }, 404);
    }

    post.likes = post.likes.filter((u: string) => u !== username);
    await kv.set(`post:${postId}`, post);

    return c.json({ post });
  } catch (error) {
    console.error('Unlike post error:', error);
    return c.json({ error: 'Ошибка отмены лайка: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/comment-post', async (c) => {
  try {
    const body = await c.req.json();
    const { postId, username, content, media } = body;

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Пост не найден' }, 404);
    }

    const commentId = generateId();
    const comment = {
      id: commentId,
      author: username,
      content,
      media: media || [],
      likes: [],
      replies: [],
      timestamp: Date.now()
    };

    post.comments.push(comment);
    await kv.set(`post:${postId}`, post);

    // Create notification
    if (post.author !== username) {
      const notifId = generateId();
      await kv.set(`notification:${post.author}:${notifId}`, {
        id: notifId,
        type: 'comment',
        from: username,
        postId,
        message: `${username} прокомментировал ваш пост`,
        timestamp: Date.now(),
        read: false
      });
    }

    return c.json({ post });
  } catch (error) {
    console.error('Comment error:', error);
    return c.json({ error: 'Ошибка комментария: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/add-comment', async (c) => {
  try {
    const body = await c.req.json();
    const { postId, username, content } = body;

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Пост не найден' }, 404);
    }

    const commentId = generateId();
    const comment = {
      id: commentId,
      author: username,
      content,
      timestamp: Date.now()
    };

    if (!post.comments) {
      post.comments = [];
    }

    post.comments.push(comment);
    await kv.set(`post:${postId}`, post);

    return c.json({ post });
  } catch (error) {
    console.error('Add comment error:', error);
    return c.json({ error: 'Ошибка добавления комментария: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/delete-post', async (c) => {
  try {
    const body = await c.req.json();
    const { postId, username } = body;

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Пост не найден' }, 404);
    }

    const user = await kv.get(`user:${username}`);
    const isAdmin = user?.isAdmin;

    if (post.author !== username && !isAdmin) {
      return c.json({ error: 'Нет прав на удаление' }, 403);
    }

    await kv.del(`post:${postId}`);

    // Remove from user's posts
    const author = await kv.get(`user:${post.author}`);
    if (author) {
      author.posts = author.posts.filter((id: string) => id !== postId);
      await kv.set(`user:${post.author}`, author);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json({ error: 'Ошибка удаления: ' + error.message }, 500);
  }
});

// Clips routes
app.post('/make-server-b8070d95/create-clip', async (c) => {
  try {
    const body = await c.req.json();
    const { username, videoUrl, thumbnail, title } = body;

    const clipId = generateId();
    const clip = {
      id: clipId,
      author: username,
      videoUrl,
      thumbnail: thumbnail || '',
      title: title || '',
      likes: [],
      comments: [],
      views: 0,
      timestamp: Date.now()
    };

    await kv.set(`clip:${clipId}`, clip);

    return c.json({ clip });
  } catch (error) {
    console.error('Create clip error:', error);
    return c.json({ error: 'Ошибка создания клипа: ' + error.message }, 500);
  }
});

app.get('/make-server-b8070d95/get-clips', async (c) => {
  try {
    const clips = await kv.getByPrefix('clip:');
    const sortedClips = clips.sort((a: any, b: any) => b.timestamp - a.timestamp);
    return c.json({ clips: sortedClips });
  } catch (error) {
    console.error('Get clips error:', error);
    return c.json({ error: 'Ошибка получения клипов: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/like-clip', async (c) => {
  try {
    const body = await c.req.json();
    const { clipId, username } = body;

    const clip = await kv.get(`clip:${clipId}`);
    if (!clip) {
      return c.json({ error: 'Клип не найден' }, 404);
    }

    if (!clip.likes.includes(username)) {
      clip.likes.push(username);
    } else {
      clip.likes = clip.likes.filter((u: string) => u !== username);
    }

    await kv.set(`clip:${clipId}`, clip);
    return c.json({ clip });
  } catch (error) {
    console.error('Like clip error:', error);
    return c.json({ error: 'Ошибка лайка клипа: ' + error.message }, 500);
  }
});

// Music routes
app.post('/make-server-b8070d95/upload-track', async (c) => {
  try {
    const body = await c.req.json();
    const { username, title, artist, audioUrl, coverUrl, duration } = body;

    const trackId = generateId();
    const track = {
      id: trackId,
      uploader: username,
      title,
      artist: artist || username,
      audioUrl,
      coverUrl: coverUrl || '',
      duration: duration || 0,
      likes: [],
      plays: 0,
      timestamp: Date.now()
    };

    await kv.set(`track:${trackId}`, track);

    return c.json({ track });
  } catch (error) {
    console.error('Upload track error:', error);
    return c.json({ error: 'Ошибка загрузки трека: ' + error.message }, 500);
  }
});

app.get('/make-server-b8070d95/get-tracks', async (c) => {
  try {
    const tracks = await kv.getByPrefix('track:');
    const sortedTracks = tracks.sort((a: any, b: any) => b.timestamp - a.timestamp);
    return c.json({ tracks: sortedTracks });
  } catch (error) {
    console.error('Get tracks error:', error);
    return c.json({ error: 'Ошибка получения треков: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/like-track', async (c) => {
  try {
    const body = await c.req.json();
    const { trackId, username } = body;

    const track = await kv.get(`track:${trackId}`);
    if (!track) {
      return c.json({ error: 'Трек не найден' }, 404);
    }

    if (!track.likes.includes(username)) {
      track.likes.push(username);
    } else {
      track.likes = track.likes.filter((u: string) => u !== username);
    }

    await kv.set(`track:${trackId}`, track);
    return c.json({ track });
  } catch (error) {
    console.error('Like track error:', error);
    return c.json({ error: 'Ошибка лайка трека: ' + error.message }, 500);
  }
});

// Notifications
app.get('/make-server-b8070d95/get-notifications/:username', async (c) => {
  try {
    const username = c.req.param('username');
    const notifications = await kv.getByPrefix(`notification:${username}:`);
    const sortedNotifications = notifications.sort((a: any, b: any) => b.timestamp - a.timestamp);
    return c.json({ notifications: sortedNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Ошибка получения уведомлений: ' + error.message }, 500);
  }
});

// Search
app.get('/make-server-b8070d95/search', async (c) => {
  try {
    const query = c.req.query('q')?.toLowerCase() || '';
    
    const users = await kv.getByPrefix('user:');
    const matchedUsers = users.filter((user: any) => 
      user.username.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
    );

    const posts = await kv.getByPrefix('post:');
    const matchedPosts = posts.filter((post: any) =>
      post.content.toLowerCase().includes(query)
    );

    return c.json({ users: matchedUsers, posts: matchedPosts });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Ошибка поиска: ' + error.message }, 500);
  }
});

// Admin routes
app.post('/make-server-b8070d95/admin/verify-user', async (c) => {
  try {
    const body = await c.req.json();
    const { adminUsername, targetUsername } = body;

    const admin = await kv.get(`user:${adminUsername}`);
    if (!admin || !admin.isAdmin) {
      return c.json({ error: 'Нет прав администратора' }, 403);
    }

    const user = await kv.get(`user:${targetUsername}`);
    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }

    user.isVerified = !user.isVerified;
    await kv.set(`user:${targetUsername}`, user);

    return c.json({ success: true, user });
  } catch (error) {
    console.error('Verify user error:', error);
    return c.json({ error: 'Ошибка верификации: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/admin/delete-user', async (c) => {
  try {
    const body = await c.req.json();
    const { adminUsername, targetUsername } = body;

    const admin = await kv.get(`user:${adminUsername}`);
    if (!admin || !admin.isAdmin) {
      return c.json({ error: 'Нет прав администратора' }, 403);
    }

    await kv.del(`user:${targetUsername}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Ошибка удаления пользователя: ' + error.message }, 500);
  }
});

app.get('/make-server-b8070d95/admin/stats', async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    const posts = await kv.getByPrefix('post:');
    const clips = await kv.getByPrefix('clip:');
    const tracks = await kv.getByPrefix('track:');

    return c.json({
      stats: {
        totalUsers: users.length,
        totalPosts: posts.length,
        totalClips: clips.length,
        totalTracks: tracks.length,
        onlineUsers: users.filter((u: any) => u.isOnline).length
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Ошибка получения статистики: ' + error.message }, 500);
  }
});

app.post('/make-server-b8070d95/admin/broadcast', async (c) => {
  try {
    const body = await c.req.json();
    const { adminUsername, message } = body;

    const admin = await kv.get(`user:${adminUsername}`);
    if (!admin || !admin.isAdmin) {
      return c.json({ error: 'Нет прав администратора' }, 403);
    }

    const users = await kv.getByPrefix('user:');
    
    for (const user of users) {
      const notifId = generateId();
      await kv.set(`notification:${user.username}:${notifId}`, {
        id: notifId,
        type: 'system',
        from: 'system',
        message,
        timestamp: Date.now(),
        read: false
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Broadcast error:', error);
    return c.json({ error: 'Ошибка рассылки: ' + error.message }, 500);
  }
});

// File upload endpoint (stores files as base64 in KV)
app.post('/make-server-b8070d95/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const username = formData.get('username') as string;
    const type = formData.get('type') as string;

    if (!file) {
      return c.json({ error: 'Файл не найден' }, 400);
    }

    // Limit file size to 5MB to prevent stack overflow
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return c.json({ error: 'Файл слишком большой. Максимальный размер: 5MB' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to prevent stack overflow
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);
    
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const fileId = generateId();
    const fileKey = `file:${username}:${type}:${fileId}`;
    
    await kv.set(fileKey, {
      id: fileId,
      username,
      type,
      dataUrl,
      mimeType,
      size: file.size,
      timestamp: Date.now()
    });

    return c.json({ url: dataUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Ошибка загрузки файла: ' + error.message }, 500);
  }
});

console.log('Server starting...');
Deno.serve(app.fetch);