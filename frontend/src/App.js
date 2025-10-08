import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Components
import Header from "./components/Header";
import ModelsList from "./components/ModelsList";
import TextPlayground from "./components/TextPlayground";
import ImagePlayground from "./components/ImagePlayground";
import AudioPlayground from "./components/AudioPlayground";
import VideoPlayground from "./components/VideoPlayground";
import Settings from "./components/Settings";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [models, setModels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [apiKey, setApiKey] = useState("");

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/models`);
      setModels(response.data);
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models from A4F API");
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKey = async () => {
    try {
      const response = await axios.get(`${API}/api-keys/a4f`);
      if (response.data && response.data.api_key) {
        setApiKey(response.data.api_key);
      }
    } catch (error) {
      // No API key stored, that's fine
    }
  };

  useEffect(() => {
    fetchModels();
    fetchApiKey();
  }, []);

  const filteredModels = models ? (() => {
    let filtered = models.models || [];
    
    // Filter by tier
    if (selectedTier !== "all") {
      filtered = filtered.filter(model => model.plan === selectedTier);
    }
    
    // Filter by category
    if (selectedCategory !== "all") {
      const categoryModels = models.categorized[selectedCategory] || [];
      const categoryModelIds = categoryModels.map(m => m.name);
      filtered = filtered.filter(model => categoryModelIds.includes(model.name));
    }
    
    return filtered;
  })() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            AI Models Hub
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Explore and interact with cutting-edge AI models across text, image, audio, and video generation. 
            Access models from different tiers and test them in dedicated playgrounds.
          </p>
        </div>

        {/* Stats Cards */}
        {models && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600">{models.total_models}</div>
              <div className="text-slate-600">Total Models</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{models.categorized.text?.length || 0}</div>
              <div className="text-slate-600">Text Models</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{models.categorized.image?.length || 0}</div>
              <div className="text-slate-600">Image Models</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {(models.categorized.audio?.length || 0) + (models.categorized.video?.length || 0)}
              </div>
              <div className="text-slate-600">A/V Models</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Tier:</label>
            <select 
              value={selectedTier} 
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Category:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Models List */}
        <ModelsList 
          models={filteredModels} 
          loading={loading} 
          onRefresh={fetchModels}
          apiKey={apiKey}
        />
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/text-playground" element={<TextPlayground />} />
          <Route path="/image-playground" element={<ImagePlayground />} />
          <Route path="/audio-playground" element={<AudioPlayground />} />
          <Route path="/video-playground" element={<VideoPlayground />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;