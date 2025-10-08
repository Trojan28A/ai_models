import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Play, Download, Trash2, Upload, Film } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";

const VideoPlayground = () => {
  const location = useLocation();
  const model = location.state?.model;
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoHistory, setVideoHistory] = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    
    // Simulate video generation
    setTimeout(() => {
      const newVideo = {
        id: Date.now(),
        prompt: prompt,
        url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4", // Placeholder
        thumbnail: "https://picsum.photos/320/180?random=" + Date.now(),
        model: model?.name || "Unknown",
        timestamp: new Date().toLocaleTimeString(),
        duration: "0:10",
        resolution: "1280x720",
      };

      setVideoHistory(prev => [newVideo, ...prev]);
      toast.success("Video generated successfully!");
      setLoading(false);
    }, 3000);
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
              {model && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-slate-600">Model:</span>
                  <Badge className="bg-red-100 text-red-800 border-red-200">{model.name}</Badge>
                  <Badge className={`${model.plan === 'free' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                    model.plan === 'basic' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-purple-100 text-purple-800 border-purple-200'}`}>
                    {model.plan?.toUpperCase()}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generation Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Generate Video</CardTitle>
              <CardDescription>Create videos from text descriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                  data-testid="generate-video-btn"
                >
                  {loading ? (
                    <>
                      <Film className="w-4 h-4 mr-2 animate-spin" />
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

              <div className="border-t pt-4">
                <h3 className="font-medium text-slate-900 mb-3">Upload Video</h3>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.info("Video upload feature coming soon!")}
                  data-testid="upload-video-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video File
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  Upload videos for editing, enhancement, or analysis
                </p>
              </div>

              {/* Generation Tips */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">💡 Generation Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be specific about scenes and actions</li>
                  <li>• Mention lighting and camera angles</li>
                  <li>• Keep descriptions under 200 characters</li>
                  <li>• Video generation may take 2-5 minutes</li>
                </ul>
              </div>

              {/* Model Info */}
              {model && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Model Details</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div><strong>Name:</strong> {model.name}</div>
                    <div><strong>Type:</strong> {model.type}</div>
                    {model.description && (
                      <div><strong>Description:</strong> {model.description}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Gallery */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Generated Videos</CardTitle>
              <CardDescription>Your video generation history ({videoHistory.length})</CardDescription>
            </CardHeader>
            <CardContent>
              {videoHistory.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500">
                  <Video className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium mb-2">No videos generated yet</p>
                  <p>Use the form on the left to generate your first video.</p>
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
  );
};

export default VideoPlayground;