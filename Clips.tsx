import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ClipsProps {
  currentUser: any;
  onViewProfile: (username: string) => void;
}

export function Clips({ currentUser, onViewProfile }: ClipsProps) {
  const [clips, setClips] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadClips();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, [currentIndex]);

  const loadClips = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/get-clips`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setClips(data.clips || []);
    } catch (err) {
      console.error('Failed to load clips:', err);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('username', currentUser.username);
      formData.append('type', 'clip');

      const uploadRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        body: formData
      });

      const uploadData = await uploadRes.json();

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/create-clip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: currentUser.username,
          videoUrl: uploadData.url,
          description
        })
      });

      const data = await response.json();
      if (data.clip) {
        setClips([data.clip, ...clips]);
        setShowUpload(false);
        setVideoFile(null);
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to upload clip:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentClip = clips[currentIndex];

  return (
    <div className="h-screen bg-black flex items-center justify-center relative">
      {showUpload ? (
        <div className="max-w-md w-full bg-white rounded-lg p-6 m-4">
          <h2 className="text-2xl font-bold mb-4">Загрузить клип</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Выберите видео</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите о вашем клипе..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleUpload}
                disabled={!videoFile || uploading}
                className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 text-sm"
              >
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        </div>
      ) : clips.length > 0 && currentClip ? (
        <>
          <video
            ref={videoRef}
            src={currentClip.videoUrl}
            className="max-h-screen w-auto max-w-full"
            loop
            playsInline
            onClick={() => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause()}
          />

          {/* Author Info */}
          <div className="absolute bottom-20 md:bottom-8 left-4 md:left-8 text-white z-10">
            <button 
              onClick={() => onViewProfile(currentClip.author)}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden" />
              <span className="font-bold text-lg">@{currentClip.author}</span>
            </button>
            {currentClip.description && (
              <p className="text-sm md:text-base">{currentClip.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 flex flex-col gap-6 z-10">
            <button className="flex flex-col items-center text-white">
              <Heart className="w-8 h-8 mb-1" />
              <span className="text-xs">{currentClip.likes?.length || 0}</span>
            </button>
            <button className="flex flex-col items-center text-white">
              <MessageCircle className="w-8 h-8 mb-1" />
              <span className="text-xs">{currentClip.comments?.length || 0}</span>
            </button>
          </div>

          {/* Navigation */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/30 transition"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === clips.length - 1}
              className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/30 transition"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => setShowUpload(true)}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            Загрузить
          </button>
        </>
      ) : (
        <div className="text-white text-center">
          <p className="mb-4 text-lg">Пока нет клипов</p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 mx-auto"
          >
            <Upload className="w-5 h-5" />
            Загрузить первый клип
          </button>
        </div>
      )}
    </div>
  );
}
