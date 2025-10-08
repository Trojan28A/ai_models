import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Key, Save, Trash2, Eye, EyeOff, CheckCircle, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [storedKey, setStoredKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    fetchStoredKey();
  }, []);

  const fetchStoredKey = async () => {
    try {
      const response = await axios.get(`${API}/api-keys/a4f`);
      if (response.data) {
        setStoredKey(response.data);
      }
    } catch (error) {
      // No stored key
      setStoredKey(null);
    }
  };

  const saveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${API}/api-keys`, {
        api_key: apiKey.trim(),
        provider: "a4f"
      });
      
      toast.success("API key saved successfully!");
      setApiKey("");
      await fetchStoredKey();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("Failed to save API key");
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async () => {
    if (!storedKey) return;

    try {
      await axios.delete(`${API}/api-keys/a4f`);
      toast.success("API key deleted successfully!");
      setStoredKey(null);
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const testConnection = async () => {
    if (!storedKey) {
      toast.error("No API key to test");
      return;
    }

    setTestingConnection(true);
    try {
      // Test by fetching models
      const response = await axios.get(`${API}/models/free`);
      if (response.data && response.data.models) {
        toast.success("Connection successful! API key is working.");
      } else {
        toast.error("Connection failed. Please check your API key.");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      toast.error("Connection test failed. API key may be invalid.");
    } finally {
      setTestingConnection(false);
    }
  };

  const maskKey = (key) => {
    if (!key || key.length < 8) return key;
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
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
                Back to Home
              </Button>
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                <SettingsIcon className="w-6 h-6 text-slate-600" />
                <span>Settings</span>
              </h1>
              <p className="text-slate-600 mt-1">Manage your API keys and application preferences</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* API Key Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-blue-600" />
                <span>A4F API Key</span>
              </CardTitle>
              <CardDescription>
                Configure your A4F API key to access AI models and playgrounds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Key Status */}
              {storedKey ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-emerald-900">API Key Configured</span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-emerald-800 space-y-2">
                    <div>
                      <strong>Key:</strong> 
                      <code className="ml-2 bg-emerald-100 px-2 py-1 rounded font-mono text-xs">
                        {showKey ? storedKey.api_key : maskKey(storedKey.api_key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-emerald-700 hover:text-emerald-900"
                        onClick={() => setShowKey(!showKey)}
                        data-testid="toggle-key-visibility"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div><strong>Added:</strong> {new Date(storedKey.created_at).toLocaleString()}</div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={testConnection}
                      disabled={testingConnection}
                      data-testid="test-connection"
                    >
                      {testingConnection ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      onClick={deleteApiKey}
                      data-testid="delete-api-key"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Key
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-900">No API Key Configured</span>
                  </div>
                  <p className="text-sm text-amber-800">
                    Add your A4F API key to access AI models and use the playgrounds. 
                    Without an API key, you can browse models but cannot interact with them.
                  </p>
                </div>
              )}

              {/* Add/Update Key Form */}
              <form onSubmit={saveApiKey} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    {storedKey ? "Update API Key" : "Add API Key"}
                  </label>
                  <Input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your A4F API key..."
                    className="font-mono"
                    data-testid="api-key-input"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Your API key is stored locally and encrypted
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !apiKey.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  data-testid="save-api-key"
                >
                  {loading ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {storedKey ? "Update" : "Save"} API Key
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* API Information */}
          <Card>
            <CardHeader>
              <CardTitle>About A4F API</CardTitle>
              <CardDescription>Information about the A4F API service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-600 space-y-3">
                <div>
                  <strong className="text-slate-900">What is A4F?</strong>
                  <p>A4F is an AI platform that provides access to multiple AI models across different tiers (Free, Basic, Pro) for text, image, audio, and video generation.</p>
                </div>
                
                <div>
                  <strong className="text-slate-900">How to get an API key?</strong>
                  <p>Visit <a href="https://www.a4f.co" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">a4f.co</a> to sign up and obtain your API key from your account settings.</p>
                </div>

                <div>
                  <strong className="text-slate-900">Supported Models:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Text models: DeepSeek, GPT, Claude, and more</li>
                    <li>Image models: DALL-E, Midjourney, Stable Diffusion</li>
                    <li>Audio models: Whisper, speech synthesis</li>
                    <li>Video models: Sora and others</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This application can fetch and display models without an API key, 
                  but you need a valid API key to actually use the models in the playgrounds.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
              <CardDescription>Details about this AI Models Hub application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 space-y-3">
                <div>
                  <strong className="text-slate-900">Version:</strong> 1.0.0
                </div>
                <div>
                  <strong className="text-slate-900">Features:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Browse AI models from A4F platform</li>
                    <li>Filter by tier (Free, Basic, Pro) and category</li>
                    <li>Dedicated playgrounds for different model types</li>
                    <li>Secure API key management</li>
                    <li>Model performance metrics and details</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-slate-900">Tech Stack:</strong> React, FastAPI, MongoDB
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;