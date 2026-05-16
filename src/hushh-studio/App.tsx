/**
 * Hushh Studio - FREE AI Video Generation
 * Powered by Google Veo 3.1 | Made with ❤️ for India
 */

import React, { useState, useRef, useCallback } from 'react';
import { useVideoGeneration } from './hooks/useVideoGeneration';
import { 
  GenerationMode, 
  AspectRatio, 
  Resolution, 
  Duration,
  SAMPLE_PROMPTS 
} from './types';

const HushhStudioApp: React.FC = () => {
  const {
    isGenerating,
    progress,
    currentVideo,
    gallery,
    settings,
    error,
    generateFromText,
    generateFromImage,
    extendVideo,
    updateSettings,
    removeFromGallery,
    clearError,
  } = useVideoGeneration();

  const [mode, setMode] = useState<GenerationMode>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string)?.split(',')[1];
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (mode === 'text-to-video') {
      await generateFromText(prompt);
    } else if (mode === 'image-to-video' && selectedImage) {
      await generateFromImage(prompt, selectedImage);
    } else if (mode === 'extend-video' && currentVideo) {
      await extendVideo(currentVideo, prompt);
    }
  }, [mode, prompt, selectedImage, currentVideo, generateFromText, generateFromImage, extendVideo]);

  // Select random prompt
  const handleRandomPrompt = () => {
    const randomPrompt = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
    setPrompt(randomPrompt);
  };

  // Download video
  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `hushh-studio-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xl">🎬</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Hushh Studio
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Free AI Video Generation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              🇮🇳 FREE for India
            </span>
            <button
              onClick={() => setShowGallery(!showGallery)}
              className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              aria-label={showGallery ? "Hide generated videos gallery" : "Show generated videos gallery"}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {gallery.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-[10px] flex items-center justify-center">
                  {gallery.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-32 px-4 max-w-4xl mx-auto">
        {/* Mode Selector */}
        <div className="mt-6 flex gap-2 justify-center flex-wrap">
          {[
            { id: 'text-to-video', label: 'Text to Video', icon: '✍️' },
            { id: 'image-to-video', label: 'Image to Video', icon: '🖼️' },
            { id: 'extend-video', label: 'Extend Video', icon: '➕' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as GenerationMode)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                mode === m.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              <span className="mr-2">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="mt-8 space-y-6">
          {/* Image Upload for Image-to-Video mode */}
          {mode === 'image-to-video' && (
            <>
              <button
                type="button"
                aria-label={selectedImage ? "Change source image" : "Upload source image"}
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-video w-full rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all overflow-hidden group text-left"
              >
                {selectedImage ? (
                  <>
                    <img
                      src={`data:image/jpeg;base64,${selectedImage}`}
                      alt="Selected"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium">Click to change image</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-center">
                      <span className="text-purple-400 font-medium">Click to upload</span> or drag an image here
                    </p>
                    <p className="text-gray-500 text-sm mt-2">Supports JPG, PNG, WebP</p>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </>
          )}

          {/* Video Preview (for extend mode or showing result) */}
          {(mode === 'extend-video' && currentVideo) || (!isGenerating && currentVideo) ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
              <video
                src={currentVideo.videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleDownload(currentVideo.videoUrl)}
                  className="p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                  title="Download"
                  aria-label="Download current video"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          ) : null}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-white/10">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Animated rings */}
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-4 border-pink-500/30 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-3xl animate-bounce">🎬</span>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-lg font-medium text-white">{progress.message}</p>
                  <div className="mt-4 w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 
                      ? `~${Math.round(progress.estimatedTimeRemaining)}s remaining`
                      : 'Processing...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'text-to-video' 
                  ? "Describe the video you want to create... Be specific about scenes, lighting, camera angles, and style."
                  : mode === 'image-to-video'
                  ? "Describe how you want to animate this image... Add motion, effects, or camera movement."
                  : "Describe how to continue this video... What should happen next?"
              }
              className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              disabled={isGenerating}
            />
            <button
              onClick={handleRandomPrompt}
              className="absolute bottom-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              title="Random prompt"
              aria-label="Use a random prompt"
            >
              🎲
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
              <p className="text-red-400">{error}</p>
              <button onClick={clearError} className="text-red-400 hover:text-red-300" aria-label="Dismiss error message">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Settings Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Video Settings
              <svg className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Aspect Ratio</label>
                <div className="flex gap-2">
                  {[
                    { value: '16:9', label: '16:9 (Landscape)', icon: '📺' },
                    { value: '9:16', label: '9:16 (Portrait/Reels)', icon: '📱' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSettings({ aspectRatio: option.value as AspectRatio })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
                        settings.aspectRatio === option.value
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Resolution</label>
                <div className="flex gap-2">
                  {[
                    { value: '720p', label: '720p' },
                    { value: '1080p', label: '1080p HD' },
                    { value: '4k', label: '4K Ultra' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSettings({ resolution: option.value as Resolution })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
                        settings.resolution === option.value
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Duration</label>
                <div className="flex gap-2">
                  {[4, 6, 8].map((d) => (
                    <button
                      key={d}
                      onClick={() => updateSettings({ duration: d as Duration })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
                        settings.duration === d
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {d} seconds
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt.trim() && mode !== 'extend-video') || (mode === 'image-to-video' && !selectedImage)}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              isGenerating || (!prompt.trim() && mode !== 'extend-video') || (mode === 'image-to-video' && !selectedImage)
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🎬</span>
                Generate Video
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Gallery Sidebar */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGallery(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 overflow-y-auto">
            <div className="sticky top-0 p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold">Generated Videos</h2>
              <button onClick={() => setShowGallery(false)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close generated videos gallery">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {gallery.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <span className="text-4xl mb-4 block">🎥</span>
                  <p>No videos generated yet</p>
                  <p className="text-sm mt-2">Start creating and your videos will appear here</p>
                </div>
              ) : (
                gallery.map((video) => (
                  <div key={video.id} className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <video
                      src={video.videoUrl}
                      className="w-full aspect-video object-cover"
                      muted
                      loop
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                    <div className="p-3">
                      <p className="text-sm text-gray-300 line-clamp-2">{video.prompt}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>{video.settings.aspectRatio} • {video.settings.resolution}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(video.videoUrl)}
                            className="p-1 hover:text-white transition-colors"
                            aria-label="Download gallery video"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeFromGallery(video.id)}
                            className="p-1 hover:text-red-400 transition-colors"
                            aria-label="Remove video from gallery"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-20 left-0 right-0 text-center text-gray-600 text-xs pb-2">
        Powered by Google Veo 3.1 • Made with ❤️ by Hushh.ai
      </div>
    </div>
  );
};

export default HushhStudioApp;
