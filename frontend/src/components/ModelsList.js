import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Play, ExternalLink, Eye, Zap, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const ModelsList = ({ models, loading, onRefresh, apiKey }) => {
  const [selectedModel, setSelectedModel] = useState(null);

  const getTierColor = (plan) => {
    switch (plan) {
      case "free": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "basic": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pro": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getFeatureColor = (feature) => {
    switch (feature) {
      case "vision": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "function_calling": return "bg-pink-100 text-pink-700 border-pink-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getPlaygroundRoute = (model) => {
    const modelType = model.type?.toLowerCase() || "";
    const modelName = model.name?.toLowerCase() || "";
    
    if (modelType.includes("chat") || modelType.includes("completion") || modelType.includes("text")) {
      return "/text-playground";
    } else if (modelType.includes("image") || modelType.includes("vision") || modelName.includes("dall") || modelName.includes("imagen")) {
      return "/image-playground";
    } else if (modelType.includes("audio") || modelType.includes("speech") || modelName.includes("whisper")) {
      return "/audio-playground";
    } else if (modelType.includes("video") || modelName.includes("sora")) {
      return "/video-playground";
    }
    return "/text-playground"; // default
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Available Models</h2>
          <Button variant="outline" disabled data-testid="refresh-models-btn">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
                <div className="w-full h-3 bg-slate-200 rounded mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="w-1/2 h-3 bg-slate-200 rounded"></div>
                  <div className="w-full h-3 bg-slate-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          Available Models {models && `(${models.length})`}
        </h2>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className="hover:bg-slate-50"
          data-testid="refresh-models-btn"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {!models || models.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Models Found</h3>
            <p className="text-slate-600 mb-4">
              Unable to fetch models from the A4F API. This might be due to network issues or API limitations.
            </p>
            <Button onClick={onRefresh} data-testid="retry-fetch-btn">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model, index) => (
            <Card 
              key={`${model.name}-${index}`} 
              className="model-card card-hover group cursor-pointer border-0 shadow-sm"
              onClick={() => setSelectedModel(selectedModel === model.name ? null : model.name)}
              data-testid={`model-card-${model.name}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {model.logoUrl && (
                      <img 
                        src={model.logoUrl} 
                        alt={model.name}
                        className="w-10 h-10 rounded-lg bg-slate-50 p-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {model.name}
                      </CardTitle>
                      <Badge className={`mt-1 text-xs font-medium ${getTierColor(model.plan)}`}>
                        {model.plan?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                
                <CardDescription className="text-sm text-slate-600 line-clamp-2 mt-2">
                  {model.description || "No description available"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Model Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      {model.context_window ? `${model.context_window.toLocaleString()} ctx` : 'N/A'}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    {model.type || 'Unknown Type'}
                  </div>
                </div>

                {/* Features */}
                {model.features && model.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {model.features.slice(0, 3).map((feature, idx) => (
                      <Badge 
                        key={idx}
                        variant="outline" 
                        className={`text-xs ${getFeatureColor(feature)}`}
                      >
                        {feature.replace('_', ' ')}
                      </Badge>
                    ))}
                    {model.features.length > 3 && (
                      <Badge variant="outline" className="text-xs text-slate-500">
                        +{model.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Performance Metrics */}
                {model.proxy_providers && model.proxy_providers[0]?.performance_metrics && (
                  <div className="text-xs text-slate-500 space-y-1">
                    {selectedModel === model.name && (
                      <div className="animate-slideIn">
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                          <div className="font-medium text-slate-700">Performance Metrics:</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>Latency: {model.proxy_providers[0].performance_metrics.latency}</div>
                            <div>Uptime: {model.proxy_providers[0].performance_metrics.uptime_percentage}%</div>
                            <div>Throughput: {model.proxy_providers[0].performance_metrics.throughput}</div>
                            <div>Provider: {model.proxy_providers[0].owned_by}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Link to={getPlaygroundRoute(model)} state={{ model }}>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 btn-hover"
                    data-testid={`test-model-${model.name}`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Test Model
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelsList;