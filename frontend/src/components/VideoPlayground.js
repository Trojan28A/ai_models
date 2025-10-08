import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Video, Play, Download, Trash2, Film, Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";
import ModelSelector from "./ModelSelector";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VideoPlayground = () => {
  const location = useLocation();
  const initialModel = location.state?.model;
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoHistory, setVideoHistory] = useState([]);
  const [apiKey, setApiKey] = useState("");
  
  // Video generation options
  const [duration, setDuration] = useState("10");
  const [resolution, setResolution] = useState("1024x576");
  const [fps, setFps] = useState("24");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [style, setStyle] = useState("");

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    try {
      const response = await axios.get(`${API}/api-keys/a4f`);
      if (response.data && response.data.api_key) {
        setApiKey(response.data.api_key);
      }
    } catch (error) {
      // No API key stored
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !selectedModel) return;

    setLoading(true);
    
    try {
      const payload = {
        model_id: selectedModel?.name || "default",
        provider_id: selectedModel?.selectedProvider?.id || undefined,
        prompt: prompt,
        duration: parseInt(duration) || 10,
        resolution: resolution,
        fps: parseInt(fps) || 24,
        aspect_ratio: aspectRatio,
        style: style || undefined,
        api_key: apiKey || undefined,
      };

      const response = await axios.post(`${API}/generate-video`, payload);

      if (response.data.success) {
        const newVideo = {
          id: Date.now(),
          prompt: prompt,
          url: response.data.video_url,
          thumbnail: response.data.thumbnail_url || `https://picsum.photos/320/180?random=${Date.now()}`,
          model: selectedModel?.name || "Unknown",
          timestamp: new Date().toLocaleTimeString(),
          duration: `${duration}s`,
          resolution: resolution,
          fps: fps,
        };

        setVideoHistory(prev => [newVideo, ...prev]);
        toast.success("Video generated successfully!");
      } else if (response.data.error) {
        toast.error(response.data.error.message || "Failed to generate video");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error?.message || "Failed to generate video");
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'generated-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Video download started!");
  };

  const clearHistory = () => {
    setVideoHistory([]);
    toast.success("Video history cleared!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm" data-testid="back-to-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Models
              </Button>
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                <Video className="w-6 h-6 text-red-600" />
                <span>Video Playground</span>
              </h1>
              {selectedModel && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-slate-600">Model:</span>
                  <Badge className="bg-red-100 text-red-800 border-red-200">{selectedModel.name}</Badge>
                  <Badge className={`${selectedModel.plan === 'free' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                    selectedModel.plan === 'basic' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-purple-100 text-purple-800 border-purple-200'}`}>
                    {selectedModel.plan?.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearHistory} 
            disabled={videoHistory.length === 0}
            data-testid="clear-video-history"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Model Selection & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Selector */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              modelType="video"
              className=""
            />

            {/* Video Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings2 className="w-5 h-5" />
                  <span>Options</span>
                </CardTitle>
                <CardDescription>Fine-tune video generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Aspect Ratio */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Aspect Ratio
                  </label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Resolution
                  </label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x576">1024x576 (HD Ready)</SelectItem>
                      <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                      <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                      <SelectItem value="2560x1440">2560x1440 (2K)</SelectItem>
                      <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Duration (seconds)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    1-60 seconds
                  </div>
                </div>

                {/* FPS */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Frames Per Second (FPS)
                  </label>
                  <Select value={fps} onValueChange={setFps}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 FPS (Cinema)</SelectItem>
                      <SelectItem value="30">30 FPS (Standard)</SelectItem>
                      <SelectItem value="60">60 FPS (Smooth)</SelectItem>
                      <SelectItem value="120">120 FPS (Very Smooth)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Style */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Style (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., cinematic, anime, realistic..."
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  />
                </div>

                {!apiKey && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      No API key configured. Add your A4F API key in 
                      <Link to="/settings" className="font-medium text-amber-900 underline ml-1">
                        Settings
                      </Link>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Generation & Gallery Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Prompt Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Video</CardTitle>
                <CardDescription>Create videos from text descriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Video Description
                    </label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the video you want to generate... e.g., 'A cat playing with a ball of yarn in a sunny garden'"
                      className="min-h-32 resize-none"
                      disabled={loading}
                      data-testid="video-prompt-input"
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      {prompt.length} characters
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !prompt.trim() || !selectedModel}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                    data-testid="generate-video-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Video Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generated Videos</CardTitle>
                <CardDescription>Your video generation history ({videoHistory.length})</CardDescription>
              </CardHeader>
              <CardContent>
                {videoHistory.length === 0 && !loading && (
                  <div className="text-center py-12 text-slate-500">
                    <Video className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No videos generated yet</p>
                    <p>Use the form above to generate your first video.</p>
                  </div>
                )}

                {loading && videoHistory.length === 0 && (
                  <div className="text-center py-12">
                    <Film className="w-12 h-12 mx-auto mb-4 animate-spin text-red-600" />
                    <p className="text-lg font-medium text-slate-900">Generating video...</p>
                    <p className="text-slate-600">This may take several minutes. Please wait.</p>
                    <div className="mt-4 bg-slate-200 rounded-full h-2 max-w-xs mx-auto">
                      <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="video-gallery">
                  {videoHistory.map((video) => (
                    <Card key={video.id} className="overflow-hidden">
                      <div className="relative aspect-video bg-slate-100">
                        <img 
                          src={video.thumbnail} 
                          alt={video.prompt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-colors cursor-pointer">
                          <Button 
                            size="lg" 
                            className="bg-white bg-opacity-90 text-slate-900 hover:bg-opacity-100"
                            onClick={() => window.open(video.url, '_blank')}
                            data-testid={`play-video-${video.id}`}
                          >
                            <Play className="w-6 h-6" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{video.prompt}</p>
                        
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                          <span>{video.timestamp}</span>
                          <div className="flex items-center space-x-2">
                            <span>{video.resolution}</span>
                            <span>{video.fps} FPS</span>
                            <Badge variant="outline" className="text-xs">{video.model}</Badge>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => downloadVideo(video.url, `video-${video.id}.mp4`)}
                            data-testid={`download-video-${video.id}`}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPrompt(video.prompt)}
                            data-testid={`reuse-prompt-${video.id}`}
                          >
                            <Video className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayground;
