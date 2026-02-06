import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Upload, Heart, Volume2, VolumeX, List, User, Clock, Shuffle, Repeat, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface MusicProps {
  currentUser: any;
}

type Tab = 'all' | 'my' | 'liked';
type RepeatMode = 'off' | 'all' | 'one';

export function Music({ currentUser }: MusicProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [originalTracks, setOriginalTracks] = useState<any[]>([]);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playingAnimation, setPlayingAnimation] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [showQueue, setShowQueue] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateTime = () => {
        setCurrentTime(audio.currentTime);
        if (progressBarRef.current) {
          const progress = (audio.currentTime / audio.duration) * 100;
          progressBarRef.current.style.width = `${progress}%`;
        }
      };
      
      const updateDuration = () => {
        if (!isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      };
      
      const handleEnded = () => {
        if (repeatMode === 'one') {
          audio.currentTime = 0;
          audio.play();
        } else {
          handleNext();
        }
      };

      const handlePlay = () => {
        setPlayingAnimation(true);
        setIsPlaying(true);
      };

      const handlePause = () => {
        setPlayingAnimation(false);
        setIsPlaying(false);
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
      };
    }
  }, [currentTrack, repeatMode]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (currentTrack) {
      const colors = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#2d4059', '#1f1f1f'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setBgColor(randomColor);
      
      document.documentElement.style.setProperty('--gradient-bg', randomColor);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (filteredTracks.length > 0 && !queue.length) {
      setQueue(filteredTracks);
    }
  }, [filteredTracks]);

  const loadTracks = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/get-tracks`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      const loadedTracks = data.tracks || [];
      setTracks(loadedTracks);
      setOriginalTracks([...loadedTracks]);
      if (loadedTracks.length > 0 && !currentTrack) {
        setCurrentTrack(loadedTracks[0]);
        setQueue(loadedTracks);
      }
    } catch (err) {
      console.error('Failed to load tracks:', err);
    }
  };

  const handleUpload = async () => {
    if (!audioFile || !trackTitle) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('username', currentUser.username);
      formData.append('type', 'track');

      const uploadRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        body: formData
      });

      const uploadData = await uploadRes.json();

      if (uploadData.error) {
        alert(uploadData.error);
        setUploading(false);
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/upload-track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: currentUser.username,
          title: trackTitle,
          artist: currentUser.username,
          audioUrl: uploadData.url
        })
      });

      const data = await response.json();
      if (data.track) {
        const newTracks = [data.track, ...tracks];
        setTracks(newTracks);
        setOriginalTracks([data.track, ...originalTracks]);
        setShowUpload(false);
        setAudioFile(null);
        setTrackTitle('');
        setQueue([data.track, ...queue]);
      }
    } catch (err) {
      console.error('Failed to upload track:', err);
      alert('Ошибка загрузки трека');
    } finally {
      setUploading(false);
    }
  };

  const handleLikeTrack = async (trackId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8070d95/like-track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          trackId,
          username: currentUser.username
        })
      });

      const data = await response.json();
      if (data.track) {
        const updatedTracks = tracks.map(t => t.id === trackId ? data.track : t);
        setTracks(updatedTracks);
        setOriginalTracks(updatedTracks.map(t => t.id === trackId ? data.track : t));
        
        if (currentTrack?.id === trackId) {
          setCurrentTrack(data.track);
        }
      }
    } catch (err) {
      console.error('Failed to like track:', err);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleNext = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (queue.length > 0) {
      let nextIndex = currentQueueIndex + 1;
      
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return;
        }
      }

      setCurrentQueueIndex(nextIndex);
      setCurrentTrack(queue[nextIndex]);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
    } else {
      let prevIndex = currentQueueIndex - 1;
      
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = queue.length - 1;
        } else {
          return;
        }
      }

      setCurrentQueueIndex(prevIndex);
      setCurrentTrack(queue[prevIndex]);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      setVolume(0);
    } else {
      setVolume(0.7);
    }
  };

  const toggleShuffle = () => {
    if (!isShuffled) {
      const shuffled = [...filteredTracks].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      setCurrentQueueIndex(0);
      if (shuffled.length > 0) {
        setCurrentTrack(shuffled[0]);
      }
    } else {
      setQueue(filteredTracks);
      const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack?.id);
      setCurrentQueueIndex(currentIndex);
    }
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getFilteredTracks = () => {
    switch (activeTab) {
      case 'my':
        return tracks.filter(track => track.uploader === currentUser.username);
      case 'liked':
        return tracks.filter(track => track.likes?.includes(currentUser?.username));
      default:
        return tracks;
    }
  };

  const filteredTracks = getFilteredTracks();

  const handleTrackSelect = (track: any, index: number) => {
    if (isShuffled) {
      const queueIndex = queue.findIndex(q => q.id === track.id);
      if (queueIndex !== -1) {
        setCurrentQueueIndex(queueIndex);
      }
    } else {
      setCurrentQueueIndex(index);
    }
    setCurrentTrack(track);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen pb-32 md:pb-24 transition-all duration-700">
      {/* Animated Background */}
      <div 
        className="fixed inset-0 -z-10 transition-all duration-1000"
        style={{ 
          background: `linear-gradient(180deg, ${bgColor} 0%, #000000 100%)`,
          opacity: 0.9
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <audio ref={audioRef} src={currentTrack?.audioUrl} preload="metadata" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-1">Музыка</h1>
            <p className="text-white/60 text-sm">Слушайте любимые треки</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/20 transition-all duration-300 flex items-center gap-2 text-sm hover:scale-105 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Загрузить
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10 animate-slideDown">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-bold">Загрузить трек</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-white/50 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Название трека</label>
                <input
                  type="text"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/30 transition-all duration-300"
                  placeholder="Введите название трека"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Аудио файл</label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-all duration-300">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer block">
                    <div className="text-white/50 mb-2">
                      <Upload className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-white text-sm mb-1">Перетащите файл или кликните для выбора</p>
                    <p className="text-white/50 text-xs">MP3, WAV, FLAC • до 5MB</p>
                  </label>
                </div>
                {audioFile && (
                  <p className="text-white text-sm mt-2">{audioFile.name}</p>
                )}
              </div>
              <button
                onClick={handleUpload}
                disabled={!audioFile || !trackTitle || uploading}
                className="w-full bg-white text-black px-6 py-3 rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:scale-[1.02] active:scale-[0.98]"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Загрузка...
                  </span>
                ) : 'Загрузить трек'}
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Player */}
          <div className="lg:col-span-2">
            {/* Current Track Player */}
            {currentTrack && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 animate-fadeIn">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Album Art with Animation */}
                  <div className="relative">
                    <div className={`w-full md:w-64 h-64 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl overflow-hidden ${playingAnimation ? 'animate-pulseSlow' : ''}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center ${playingAnimation ? 'animate-spinSlow' : ''}`}>
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/30 to-transparent flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/10" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                      {isPlaying ? (
                        <div className="flex gap-0.5">
                          <div className="w-1 h-3 bg-white rounded-full animate-wave" />
                          <div className="w-1 h-6 bg-white rounded-full animate-wave delay-150" />
                          <div className="w-1 h-4 bg-white rounded-full animate-wave delay-300" />
                        </div>
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Track Info & Controls */}
                  <div className="flex-1">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">Сейчас играет</span>
                      </div>
                      <h2 className="text-white text-2xl md:text-3xl font-bold mb-2 line-clamp-1">{currentTrack.title}</h2>
                      <p className="text-white/60 text-sm">@{currentTrack.artist || currentTrack.uploader}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <button
                          onClick={() => handleLikeTrack(currentTrack.id)}
                          className="p-2 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110"
                        >
                          <Heart 
                            className={`w-5 h-5 transition-all duration-300 ${
                              currentTrack.likes?.includes(currentUser?.username) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-white/60 hover:text-white'
                            }`} 
                          />
                        </button>
                        <span className="text-white/40 text-sm">
                          {currentTrack.likes?.length || 0} лайков
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div 
                        className="h-1.5 bg-white/20 rounded-full cursor-pointer relative"
                        onClick={handleSeek}
                      >
                        <div 
                          ref={progressBarRef}
                          className="h-full bg-white rounded-full transition-all duration-300"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        >
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="flex justify-between text-white/50 text-xs mt-2">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={toggleShuffle}
                          className={`p-3 rounded-full transition-all duration-300 hover:bg-white/10 ${
                            isShuffled ? 'text-white bg-white/10' : 'text-white/60'
                          }`}
                        >
                          <Shuffle className="w-5 h-5" />
                        </button>

                        <button
                          onClick={handlePrevious}
                          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
                        >
                          <SkipBack className="w-6 h-6" />
                        </button>

                        <button
                          onClick={handlePlayPause}
                          className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95"
                        >
                          {isPlaying ? (
                            <Pause className="w-7 h-7" />
                          ) : (
                            <Play className="w-7 h-7 ml-1" />
                          )}
                        </button>

                        <button
                          onClick={handleNext}
                          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
                        >
                          <SkipForward className="w-6 h-6" />
                        </button>

                        <button
                          onClick={toggleRepeat}
                          className={`p-3 rounded-full transition-all duration-300 hover:bg-white/10 ${
                            repeatMode !== 'off' ? 'text-white bg-white/10' : 'text-white/60'
                          }`}
                        >
                          <Repeat className="w-5 h-5" />
                          {repeatMode === 'one' && (
                            <span className="absolute -top-1 -right-1 text-xs">1</span>
                          )}
                        </button>
                      </div>

                      {/* Volume Control */}
                      <div className="relative">
                        <button
                          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                          onMouseEnter={() => setShowVolumeSlider(true)}
                          className="text-white/60 hover:text-white transition-all duration-300"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-5 h-5" />
                          ) : volume < 0.5 ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </button>
                        
                        {showVolumeSlider && (
                          <div 
                            ref={volumeRef}
                            className="absolute -top-32 -right-2 bg-white/10 backdrop-blur-xl rounded-xl p-3 w-48"
                            onMouseLeave={() => setShowVolumeSlider(false)}
                          >
                            <div className="rotate-90 h-40 flex items-center justify-center">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-32 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Queue & Info */}
          <div className="space-y-6">
            {/* Queue Info */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg">Очередь воспроизведения</h3>
                <span className="text-white/40 text-sm">{queue.length} треков</span>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {queue.slice(currentQueueIndex, currentQueueIndex + 5).map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      index === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {index === 0 ? (
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-2 bg-white rounded-full animate-wave" />
                          <div className="w-0.5 h-3 bg-white rounded-full animate-wave delay-150" />
                          <div className="w-0.5 h-2 bg-white rounded-full animate-wave delay-300" />
                        </div>
                      ) : (
                        <span className="text-white/40 text-sm">{currentQueueIndex + index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{track.title}</p>
                      <p className="text-white/40 text-xs truncate">@{track.artist || track.uploader}</p>
                    </div>
                    <button
                      onClick={() => handleLikeTrack(track.id)}
                      className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                    >
                      <Heart 
                        className={`w-4 h-4 transition-all duration-300 ${
                          track.likes?.includes(currentUser?.username) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-white/40 hover:text-white'
                        }`} 
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <h3 className="text-white font-bold text-lg mb-4">Статистика</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Всего треков</p>
                  <p className="text-white text-2xl font-bold">{tracks.length}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Ваши треки</p>
                  <p className="text-white text-2xl font-bold">{tracks.filter(t => t.uploader === currentUser.username).length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto py-2">
          {([
            { id: 'all', label: 'Все треки', icon: List, count: tracks.length },
            { id: 'my', label: 'Мои треки', icon: User, count: tracks.filter(t => t.uploader === currentUser.username).length },
            { id: 'liked', label: 'Понравившиеся', icon: Heart, count: tracks.filter(t => t.likes?.includes(currentUser?.username)).length }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Track List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.length === 0 ? (
            <div className="col-span-3 text-center text-white/50 py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                <List className="w-8 h-8" />
              </div>
              <p className="text-lg mb-2">
                {activeTab === 'my' && 'У вас пока нет загруженных треков'}
                {activeTab === 'liked' && 'Вы еще не добавили треки в избранное'}
                {activeTab === 'all' && 'Пока нет треков'}
              </p>
              {activeTab === 'my' && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="text-white hover:text-white/80 underline text-sm"
                >
                  Загрузить первый трек
                </button>
              )}
            </div>
          ) : (
            filteredTracks.map((track, index) => (
              <div
                key={track.id}
                className={`group relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-[1.02] overflow-hidden ${
                  currentTrack?.id === track.id ? 'ring-2 ring-white/30' : ''
                }`}
                onClick={() => handleTrackSelect(track, index)}
              >
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="flex items-center gap-4">
                    {/* Track Number/Play Button */}
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center">
                        {currentTrack?.id === track.id ? (
                          <div className={`${playingAnimation ? 'animate-spinSlow' : ''}`}>
                            <div className="w-6 h-6 rounded-full border-2 border-white/50" />
                          </div>
                        ) : (
                          <span className="text-white/60 text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate text-sm group-hover:text-white/90 transition-colors duration-300">
                        {track.title}
                      </h4>
                      <p className="text-white/60 text-xs truncate">@{track.artist || track.uploader}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {track.duration ? formatTime(track.duration) : '0:00'}
                        </span>
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {track.likes?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeTrack(track.id);
                      }}
                      className="p-2 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      <Heart 
                        className={`w-5 h-5 transition-all duration-300 ${
                          track.likes?.includes(currentUser?.username) 
                            ? 'fill-red-500 text-red-500 scale-110' 
                            : 'text-white/40 group-hover:text-white'
                        }`} 
                      />
                    </button>
                  </div>
                </div>

                {/* Active Indicator */}
                {currentTrack?.id === track.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/80 to-white/40" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Global Styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulseSlow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes wave {
          0%, 60%, 100% {
            transform: scaleY(1);
          }
          30% {
            transform: scaleY(1.5);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-pulseSlow {
          animation: pulseSlow 2s ease-in-out infinite;
        }

        .animate-spinSlow {
          animation: spinSlow 20s linear infinite;
        }

        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        input[type="range"] {
          -webkit-appearance: none;
          background: transparent;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          margin-top: -6px;
        }

        input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
        }

        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        input[type="range"]::-moz-range-track {
          height: 4px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}