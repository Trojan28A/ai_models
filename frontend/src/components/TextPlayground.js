import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Send, Loader2, Copy, Download, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TextPlayground = () => {
  const location = useLocation();
  const model = location.state?.model;
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([1000]);
  const [apiKey, setApiKey] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        model_id: model?.name || "default",
        prompt: prompt,
        temperature: temperature[0],
        max_tokens: maxTokens[0],
        api_key: apiKey || undefined,
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.data.response || "No response received",
        timestamp: new Date().toLocaleTimeString(),
        usage: response.data.usage,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success("Response generated successfully!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate response");
      
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request.",
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard!");
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared!");
  };

  const exportChat = () => {
    const chatText = messages.map(msg => 
      `[${msg.timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${model?.name || 'conversation'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Chat exported successfully!");
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
                <Zap className="w-6 h-6 text-blue-600" />
                <span>Text Playground</span>
              </h1>
              {model && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-slate-600">Model:</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">{model.name}</Badge>
                  <Badge className={`${model.plan === 'free' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                    model.plan === 'basic' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-purple-100 text-purple-800 border-purple-200'}`}>
                    {model.plan?.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={exportChat} disabled={messages.length === 0} data-testid="export-chat">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearChat} disabled={messages.length === 0} data-testid="clear-chat">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
              <CardDescription>Adjust model parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Temperature: {temperature[0]}
                </label>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                  data-testid="temperature-slider"
                />
                <div className="text-xs text-slate-500 mt-1">
                  Controls randomness (0 = focused, 1 = creative)
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Max Tokens: {maxTokens[0]}
                </label>
                <Slider
                  value={maxTokens}
                  onValueChange={setMaxTokens}
                  max={4000}
                  min={50}
                  step={50}
                  className="w-full"
                  data-testid="max-tokens-slider"
                />
                <div className="text-xs text-slate-500 mt-1">
                  Maximum response length
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

          {/* Chat Area */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Chat</CardTitle>
              <CardDescription>Interact with your selected AI model</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-slate-50 rounded-lg" data-testid="chat-messages">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">Start a conversation</p>
                    <p>Type a message below to begin chatting with the AI model.</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-3xl p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.isError
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-1">
                            {message.role === 'user' ? 'You' : model?.name || 'Assistant'}
                          </div>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          {message.usage && (
                            <div className="text-xs opacity-70 mt-2">
                              Tokens: {message.usage.total_tokens} (prompt: {message.usage.prompt_tokens}, completion: {message.usage.completion_tokens})
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`ml-2 ${message.role === 'user' ? 'text-white hover:bg-blue-700' : 'text-slate-400 hover:bg-slate-100'}`}
                          onClick={() => copyMessage(message.content)}
                          data-testid={`copy-message-${message.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-xs opacity-60 mt-2">{message.timestamp}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-slate-900 border border-slate-200 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-20 resize-none"
                  disabled={loading}
                  data-testid="chat-input"
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-500">
                    {prompt.length} characters
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || !prompt.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    data-testid="send-message"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {loading ? "Sending..." : "Send"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TextPlayground;