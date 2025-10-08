import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, Zap, Info, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ModelSelector = ({ selectedModel, onModelChange, modelType = "all", className = "" }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API}/models`);
      
      if (response.data && response.data.models) {
        let filteredModels = response.data.models;
        
        // Filter by model type if specified
        if (modelType !== "all") {
          const categorized = response.data.categorized;
          if (categorized && categorized[modelType]) {
            const categoryModelNames = categorized[modelType].map(m => m.name);
            filteredModels = filteredModels.filter(model => 
              categoryModelNames.includes(model.name)
            );
          }
        }
        
        setModels(filteredModels);
      } else {
        setError("No models found");
      }
    } catch (err) {
      console.error("Error fetching models:", err);
      setError("Failed to load models");
      toast.error("Failed to fetch available models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [modelType]);

  const getTierColor = (plan) => {
    switch (plan) {
      case "free": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "basic": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pro": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getModelTypeIcon = (type) => {
    const typeStr = type?.toLowerCase() || "";
    if (typeStr.includes("image")) return "🖼️";
    if (typeStr.includes("audio")) return "🎵";
    if (typeStr.includes("video")) return "🎥";
    return "💬";
  };

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Model Selection</span>
            <RefreshCw className="w-4 h-4 animate-spin ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Model Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-3">{error}</p>
            <Button onClick={fetchModels} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter models based on search query
  const filteredModels = models.filter(model => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return model.name?.toLowerCase().includes(searchLower);
  });

  const selectedModelData = models.find(m => m.name === selectedModel?.name || m.name === selectedModel);
  
  // Get available providers for selected model
  const availableProviders = selectedModelData?.proxy_providers || [];
  const currentProvider = selectedProvider || (availableProviders.length > 0 ? availableProviders[0] : null);

  // Handle model change with provider
  const handleModelChange = (modelName) => {
    const model = models.find(m => m.name === modelName);
    if (model) {
      // Select first provider by default
      const firstProvider = model.proxy_providers?.[0];
      setSelectedProvider(firstProvider);
      onModelChange({ ...model, selectedProvider: firstProvider });
    }
  };

  // Handle provider change
  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    if (selectedModelData) {
      onModelChange({ ...selectedModelData, selectedProvider: provider });
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Model Selection</span>
          </CardTitle>
          <Button onClick={fetchModels} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Search Models
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Type to search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Choose Model ({filteredModels.length} {searchQuery ? 'found' : 'available'})
          </label>
          <Select 
            value={selectedModel?.name || selectedModel || ""} 
            onValueChange={handleModelChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {filteredModels.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No models found matching "{searchQuery}"
                </div>
              ) : (
                filteredModels.map((model) => {
                  const firstProvider = model.proxy_providers?.[0];
                  const providerName = firstProvider?.id?.split('/')?.[0] || '';
                  
                  return (
                    <SelectItem key={model.name} value={model.name} className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-2 w-full">
                        <span className="text-lg">{getModelTypeIcon(model.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{model.name}</div>
                          <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                            {providerName && (
                              <span className="font-medium text-blue-600">{providerName}</span>
                            )}
                            {providerName && (model.description || model.type) && <span>•</span>}
                            <span>{model.description || model.type}</span>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getTierColor(model.plan)} ml-2`}>
                          {model.plan?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Provider Selector - Show only if multiple providers available */}
        {selectedModelData && availableProviders.length > 1 && (
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Provider ({availableProviders.length} available)
            </label>
            <Select 
              value={currentProvider?.id || ""} 
              onValueChange={(value) => {
                const provider = availableProviders.find(p => p.id === value);
                handleProviderChange(provider);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider..." />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{provider.id}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selected Model Info */}
        {selectedModelData && (
          <div className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Selected Model</span>
              </h4>
              <Badge className={getTierColor(selectedModelData.plan)}>
                {selectedModelData.plan?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-600">Type:</span>
                <div className="font-medium">{selectedModelData.type || 'Unknown'}</div>
              </div>
              {selectedModelData.context_window && (
                <div>
                  <span className="text-slate-600">Context:</span>
                  <div className="font-medium">{selectedModelData.context_window.toLocaleString()} tokens</div>
                </div>
              )}
            </div>
            
            {selectedModelData.description && (
              <div>
                <span className="text-slate-600 text-sm">Description:</span>
                <p className="text-sm text-slate-700 mt-1">{selectedModelData.description}</p>
              </div>
            )}
            
            {selectedModelData.features && selectedModelData.features.length > 0 && (
              <div>
                <span className="text-slate-600 text-sm">Features:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedModelData.features.slice(0, 4).map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {feature.replace('_', ' ')}
                    </Badge>
                  ))}
                  {selectedModelData.features.length > 4 && (
                    <Badge variant="outline" className="text-xs text-slate-500">
                      +{selectedModelData.features.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {!selectedModelData && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Please select a model to start using the playground.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelSelector;