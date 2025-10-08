import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Image as ImageIcon, Loader2, Download, Trash2, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";
import ModelSelector from "./ModelSelector";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ImagePlayground = () => {
  const location = useLocation();
  const initialModel = location.state?.model;
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [apiKey, setApiKey] = useState("");
  
  // Image generation options
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [quality, setQuality] = useState("standard");
  const [style, setStyle] = useState("");
  const [cfgScale, setCfgScale] = useState([7.0]);
  const [steps, setSteps] = useState([20]);
  const [seed, setSeed] = useState("");

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
        negative_prompt: negativePrompt || undefined,
        aspect_ratio: aspectRatio,
        quality: quality,
        style: style || undefined,
        cfg_scale: cfgScale[0],
        steps: steps[0],
        seed: seed ? parseInt(seed) : undefined,
        api_key: apiKey || undefined,
      };

      const response = await axios.post(`${API}/generate-image`, payload);

      if (response.data.success) {
        const newImage = {
          id: Date.now(),
          prompt: prompt,
          url: response.data.image_url,
          model: selectedModel?.name || "Unknown",
          timestamp: new Date().toLocaleTimeString(),
          ...response.data,
        };

        setGeneratedImages(prev => [newImage, ...prev]);
        toast.success("Image generated successfully!");
      } else if (response.data.error) {
        toast.error(response.data.error.message || "Failed to generate image");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error?.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'generated-image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const clearGallery = () => {
    setGeneratedImages([]);
    toast.success("Gallery cleared!");
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
                <ImageIcon className="w-6 h-6 text-purple-600" />
                <span>Image Playground</span>
              </h1>
              {selectedModel && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-slate-600">Model:</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">{selectedModel.name}</Badge>
                  <Badge className={`${selectedModel.plan === 'free' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                    selectedModel.plan === 'basic' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-purple-100 text-purple-800 border-purple-200'}`}>
                    {selectedModel.plan?.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearGallery} 
              disabled={generatedImages.length === 0}
              data-testid="clear-gallery"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Gallery
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Model Selection & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Selector */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              modelType="image"
              className=""
            />

            {/* Generation Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings2 className="w-5 h-5" />
                  <span>Options</span>
                </CardTitle>
                <CardDescription>Fine-tune image generation</CardDescription>
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
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                      <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                      <SelectItem value="3:2">3:2 (Classic)</SelectItem>
                      <SelectItem value="2:3">2:3 (Portrait)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quality */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Quality
                  </label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High (HD)</SelectItem>
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
                    placeholder="e.g., vivid, natural, artistic..."
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  />
                </div>

                {/* CFG Scale */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    CFG Scale: {cfgScale[0]}
                  </label>
                  <Slider
                    value={cfgScale}
                    onValueChange={setCfgScale}
                    max={20}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    How strictly to follow prompt
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Steps: {steps[0]}
                  </label>
                  <Slider
                    value={steps}
                    onValueChange={setSteps}
                    max={50}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    More steps = higher quality (slower)
                  </div>
                </div>

                {/* Seed */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Seed (Optional)
                  </label>
                  <Input
                    type="number"
                    placeholder="Random if empty"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Use same seed for consistent results
                  </div>
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

          {/* Main Generation Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Prompt Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Image</CardTitle>
                <CardDescription>Create images from text prompts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Prompt
                    </label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      className="min-h-24 resize-none"
                      disabled={loading}
                      data-testid="image-prompt-input"
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      {prompt.length} characters
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Negative Prompt (Optional)
                    </label>
                    <Textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="What to avoid in the image..."
                      className="min-h-20 resize-none"
                      disabled={loading}
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      Specify what you don't want in the image
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !prompt.trim() || !selectedModel}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    data-testid="generate-image-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Generated Images Gallery */}
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Generated Images</CardTitle>
                  <CardDescription>Your image generation history ({generatedImages.length})</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  data-testid="refresh-gallery"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {generatedImages.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium mb-2">No images generated yet</p>
                  <p>Use the form on the left to generate your first image.</p>
                </div>
              )}

              {loading && generatedImages.length === 0 && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
                  <p className="text-lg font-medium text-slate-900">Generating your image...</p>
                  <p className="text-slate-600">This may take a few moments.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="image-gallery">
                {generatedImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-square bg-slate-100">
                      <img 
                        src={image.url} 
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%2364748b' font-family='sans-serif' font-size='16'%3EImage unavailable%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{image.prompt}</p>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span>{image.timestamp}</span>
                        <Badge variant="outline" className="text-xs">{image.model}</Badge>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => downloadImage(image.url, `image-${image.id}.jpg`)}
                          data-testid={`download-image-${image.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPrompt(image.prompt)}
                          data-testid={`reuse-prompt-${image.id}`}
                        >
                          <RefreshCw className="w-4 h-4" />
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

export default ImagePlayground;