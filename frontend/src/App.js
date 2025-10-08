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
  const [searchQuery, setSearchQuery] = useState("");
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
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query) ||
        model.base_model?.toLowerCase().includes(query)
      );
    }
    
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

        {/* Search and Filters */}
        <div className="flex flex-col gap-6 items-center">
          {/* Search Bar */}
          <div className="w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search models by name, description, or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-slate-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                data-testid="search-input"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-6 items-center justify-center">
            {/* Tier Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 text-center">Tier:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All Tiers", color: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
                  { value: "free", label: "Free", color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" },
                  { value: "basic", label: "Basic", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
                  { value: "pro", label: "Pro", color: "bg-purple-100 text-purple-800 hover:bg-purple-200" }
                ].map((tier) => (
                  <button
                    key={tier.value}
                    onClick={() => setSelectedTier(tier.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTier === tier.value 
                        ? `${tier.color} ring-2 ring-offset-2 ring-blue-500 shadow-md` 
                        : `${tier.color} hover:shadow-sm`
                    }`}
                    data-testid={`tier-filter-${tier.value}`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 text-center">Category:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All", icon: "⚡" },
                  { value: "text", label: "Text", icon: "💬" },
                  { value: "image", label: "Image", icon: "🖼️" },
                  { value: "audio", label: "Audio", icon: "🎵" },
                  { value: "video", label: "Video", icon: "🎥" },
                  { value: "other", label: "Other", icon: "⚙️" }
                ].map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedCategory === category.value 
                        ? "bg-blue-100 text-blue-800 ring-2 ring-offset-2 ring-blue-500 shadow-md" 
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm"
                    }`}
                    data-testid={`category-filter-${category.value}`}
                  >
                    <span>{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Results Summary */}
          {(searchQuery || selectedTier !== "all" || selectedCategory !== "all") && (
            <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg">
              {searchQuery && <span>Search: "{searchQuery}" </span>}
              {selectedTier !== "all" && <span>• Tier: {selectedTier} </span>}
              {selectedCategory !== "all" && <span>• Category: {selectedCategory} </span>}
              <span>• Found: {filteredModels.length} models</span>
            </div>
          )}
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