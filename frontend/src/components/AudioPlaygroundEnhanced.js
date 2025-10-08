import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Mic, Play, Pause, Download, Trash2, Volume2, Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";
import ModelSelector from "./ModelSelector";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AudioPlayground = () => {
  const location = useLocation();
  const initialModel = location.state?.model;
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioHistory, setAudioHistory] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const audioRefs = useRef({});
  
  // Audio generation options
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState([1.0]);
  const [language, setLanguage] = useState("");
  const [format, setFormat] = useState("mp3");

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
        voice: voice,
        speed: speed[0],
        language: language || undefined,
        format: format,
        api_key: apiKey || undefined,
      };

      const response = await axios.post(`${API}/generate-audio`, payload);

      if (response.data.success) {
        const newAudio = {
          id: Date.now(),
          prompt: prompt,
          url: response.data.audio_url,
          model: selectedModel?.name || "Unknown",
          timestamp: new Date().toLocaleTimeString(),
          duration: response.data.duration || "Unknown",
          voice: voice,
          format: format,
        };

        setAudioHistory(prev => [newAudio, ...prev]);
        toast.success("Audio generated successfully!");
      } else if (response.data.error) {
        toast.error(response.data.error.message || "Failed to generate audio");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error?.message || "Failed to generate audio");
    } finally {
      setLoading(false);
    }
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
    a.download = filename || 'generated-audio.mp3';
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
              {selectedModel && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-slate-600">Model:</span>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">{selectedModel.name}</Badge>
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
            disabled={audioHistory.length === 0}
            data-testid="clear-audio-history"
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
              modelType="audio"
              className=""
            />

            {/* Audio Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings2 className="w-5 h-5" />
                  <span>Options</span>
                </CardTitle>
                <CardDescription>Fine-tune audio generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Voice Selection */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Voice
                  </label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Speed */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Speed: {speed[0]}x
                  </label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    max={4.0}
                    min={0.25}
                    step={0.25}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    0.25x (very slow) to 4.0x (very fast)
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Audio Format
                  </label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="opus">Opus</SelectItem>
                      <SelectItem value="aac">AAC</SelectItem>
                      <SelectItem value="flac">FLAC</SelectItem>
                      <SelectItem value="wav">WAV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language (Optional) */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Language (Optional)
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto-detect</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                    </SelectContent>
                  </Select>
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

          {/* Main Generation & History Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Prompt Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Audio</CardTitle>
                <CardDescription>Convert text to speech or generate audio</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Text to Speech
                    </label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter text to convert to speech..."
                      className="min-h-24 resize-none"
                      disabled={loading}
                      data-testid="audio-prompt-input"
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      {prompt.length} characters
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !prompt.trim() || !selectedModel}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    data-testid="generate-audio-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
              </CardContent>
            </Card>

            {/* Audio History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audio History</CardTitle>
                <CardDescription>Your generated audio files ({audioHistory.length})</CardDescription>
              </CardHeader>
              <CardContent>
                {audioHistory.length === 0 && !loading && (
                  <div className="text-center py-12 text-slate-500">
                    <Mic className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No audio generated yet</p>
                    <p>Use the form above to generate your first audio.</p>
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
                            <Badge variant="outline" className="text-xs">{audio.voice}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAudio(audio.url, `audio-${audio.id}.${audio.format}`)}
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
    </div>
  );
};

export default AudioPlayground;
