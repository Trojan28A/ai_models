import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic, Play, Pause, Download, Trash2, Upload, Volume2 } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";

const AudioPlayground = () => {
  const location = useLocation();
  const model = location.state?.model;
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioHistory, setAudioHistory] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const audioRefs = useRef({});

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    
    // Simulate audio generation
    setTimeout(() => {
      const newAudio = {
        id: Date.now(),
        prompt: prompt,
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Placeholder
        model: model?.name || "Unknown",
        timestamp: new Date().toLocaleTimeString(),
        duration: "0:30",
      };

      setAudioHistory(prev => [newAudio, ...prev]);
      toast.success("Audio generated successfully!");
      setLoading(false);
    }, 2000);
  };

  const togglePlayback = (id, url) => {
    const audio = audioRefs.current[id];
    
    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
    } else {
      // Pause any currently playing audio
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }
      
      if (!audio) {
        audioRefs.current[id] = new Audio(url);
        audioRefs.current[id].onended = () => setPlayingId(null);
      }
      
      audioRefs.current[id].play().catch(() => {
        toast.error("Failed to play audio");
      });
      setPlayingId(id);
    }
  };

  const downloadAudio = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'generated-audio.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Audio download started!");
  };

  const clearHistory = () => {
    setAudioHistory([]);
    setPlayingId(null);
    Object.values(audioRefs.current).forEach(audio => audio.pause());
    audioRefs.current = {};
    toast.success("Audio history cleared!");
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
                <Mic className="w-6 h-6 text-orange-600" />
                <span>Audio Playground</span>
              </h1>
              {model && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-slate-600">Model:</span>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">{model.name}</Badge>
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
            disabled={audioHistory.length === 0}
            data-testid="clear-audio-history"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generation Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Generate Audio</CardTitle>
              <CardDescription>Create audio from text or upload for processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Text to Speech / Audio Description
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter text to convert to speech or describe the audio you want to generate..."
                    className="min-h-24 resize-none"
                    disabled={loading}
                    data-testid="audio-prompt-input"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  data-testid="generate-audio-btn"
                >
                  {loading ? (
                    <>
                      <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Generate Audio
                    </>
                  )}
                </Button>
              </form>

              <div className="border-t pt-4">
                <h3 className="font-medium text-slate-900 mb-3">Upload Audio</h3>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.info("Audio upload feature coming soon!")}
                  data-testid="upload-audio-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio File
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  Upload audio files for transcription, translation, or analysis
                </p>
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

          {/* Audio History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Audio History</CardTitle>
              <CardDescription>Your generated and processed audio files ({audioHistory.length})</CardDescription>
            </CardHeader>
            <CardContent>
              {audioHistory.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500">
                  <Mic className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium mb-2">No audio generated yet</p>
                  <p>Use the form on the left to generate your first audio.</p>
                </div>
              )}

              {loading && audioHistory.length === 0 && (
                <div className="text-center py-12">
                  <Volume2 className="w-12 h-12 mx-auto mb-4 animate-pulse text-orange-600" />
                  <p className="text-lg font-medium text-slate-900">Generating audio...</p>
                  <p className="text-slate-600">This may take a few moments.</p>
                </div>
              )}

              <div className="space-y-4" data-testid="audio-history">
                {audioHistory.map((audio) => (
                  <Card key={audio.id} className="p-4">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePlayback(audio.id, audio.url)}
                        data-testid={`play-audio-${audio.id}`}
                      >
                        {playingId === audio.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {audio.prompt}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                          <span>{audio.timestamp}</span>
                          <span>{audio.duration}</span>
                          <Badge variant="outline" className="text-xs">{audio.model}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAudio(audio.url, `audio-${audio.id}.wav`)}
                          data-testid={`download-audio-${audio.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Audio waveform placeholder */}
                    <div className="mt-3 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded flex items-center justify-center">
                      <div className="flex items-center space-x-1">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 bg-orange-400 rounded ${
                              playingId === audio.id ? 'animate-pulse' : ''
                            }`}
                            style={{ 
                              height: `${Math.random() * 24 + 8}px`,
                              opacity: playingId === audio.id ? 0.8 : 0.4 
                            }}
                          />
                        ))}
                      </div>
                    </div>
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

export default AudioPlayground;