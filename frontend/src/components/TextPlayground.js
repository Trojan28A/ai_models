import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Send, Loader2, Copy, Download, Trash2, Zap, Settings2, MessageSquare, Bot } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";
import ModelSelector from "./ModelSelector";
import ErrorDisplay from "./ErrorDisplay";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TextPlayground = () => {
  const location = useLocation();
  const initialModel = location.state?.model;
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Enhanced parameters
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([1000]);
  const [topP, setTopP] = useState([1.0]);
  const [frequencyPenalty, setFrequencyPenalty] = useState([0.0]);
  const [presencePenalty, setPresencePenalty] = useState([0.0]);
  const [conversationMode, setConversationMode] = useState("single"); // single, conversation
  
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
    if (!prompt.trim() || !selectedModel) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      // Build conversation history for conversation mode
      const conversationHistory = conversationMode === "conversation" 
        ? messages.filter(msg => !msg.isError).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        : [];

      const response = await axios.post(`${API}/chat`, {
        model_id: selectedModel?.name || "default",
        provider_id: selectedModel?.selectedProvider?.id || undefined,
        prompt: prompt,
        system_prompt: systemPrompt || undefined,
        temperature: temperature[0],
        max_tokens: maxTokens[0],
        top_p: topP[0],
        frequency_penalty: frequencyPenalty[0],
        presence_penalty: presencePenalty[0],
        conversation_history: conversationHistory,
        api_key: apiKey || undefined,
      });

      if (response.data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: response.data.response,
          timestamp: new Date().toLocaleTimeString(),
          usage: response.data.usage,
          finish_reason: response.data.finish_reason,
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success("Response generated successfully!");
      } else if (response.data.error) {
        setError(response.data.error);
        toast.error(response.data.error.message);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorInfo = {
        type: "request_failed",
        message: "❌ Failed to send request",
        suggestion: "Please check your connection and try again.",
        action: "retry"
      };
      setError(errorInfo);
      toast.error("Failed to generate response");
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
    setError(null);
    toast.success("Chat cleared!");
  };

  const handleRetry = () => {
    if (prompt) {
      handleSubmit({ preventDefault: () => {} });
    }
  };

  const handleSwitchModel = () => {
    // Focus on model selector (you could scroll to it or highlight it)
    document.querySelector('[data-testid="model-selector"]')?.scrollIntoView({ behavior: 'smooth' });
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
              {selectedModel && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-slate-600">Model:</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">{selectedModel.name}</Badge>
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
          {/* Left Sidebar - Model Selection & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Selector */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              modelType="text"
              className=""
              data-testid="model-selector"
            />

            {/* Settings Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings2 className="w-5 h-5" />
                  <span>Parameters</span>
                </CardTitle>
                <CardDescription>Fine-tune model behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Conversation Mode */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Conversation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={conversationMode === "single" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConversationMode("single")}
                      className="text-xs"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Single
                    </Button>
                    <Button
                      variant={conversationMode === "conversation" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConversationMode("conversation")}
                      className="text-xs"
                    >
                      <Bot className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {conversationMode === "single" ? "Each message is independent" : "Maintains conversation context"}
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    System Prompt
                  </label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="You are a helpful assistant..."
                    className="min-h-20 text-xs"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Set the AI's personality and behavior
                  </div>
                </div>
                
                {/* Temperature */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Temperature: {temperature[0]}
                  </label>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                    data-testid="temperature-slider"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Controls creativity (0 = focused, 2 = very creative)
                  </div>
                </div>
                
                {/* Max Tokens */}
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

                {/* Top P */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Top P: {topP[0]}
                  </label>
                  <Slider
                    value={topP}
                    onValueChange={setTopP}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Nucleus sampling threshold
                  </div>
                </div>

                {/* Frequency Penalty */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Frequency Penalty: {frequencyPenalty[0]}
                  </label>
                  <Slider
                    value={frequencyPenalty}
                    onValueChange={setFrequencyPenalty}
                    max={2}
                    min={-2}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Reduces repetition of frequent tokens
                  </div>
                </div>

                {/* Presence Penalty */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Presence Penalty: {presencePenalty[0]}
                  </label>
                  <Slider
                    value={presencePenalty}
                    onValueChange={setPresencePenalty}
                    max={2}
                    min={-2}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Reduces repetition of any tokens
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

          {/* Chat Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Error Display */}
            {error && (
              <ErrorDisplay 
                error={error} 
                onRetry={handleRetry}
                onSwitchModel={handleSwitchModel}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Chat Interface</span>
                </CardTitle>
                <CardDescription>
                  {selectedModel 
                    ? `Chatting with ${selectedModel.name} ${conversationMode === "conversation" ? "(conversation mode)" : "(single message mode)"}`
                    : "Select a model to start chatting"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedModel ? (
                  <div className="text-center py-12 text-slate-500">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No Model Selected</p>
                    <p>Please select a model from the sidebar to start chatting.</p>
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-slate-50 rounded-lg" data-testid="chat-messages">
                      {messages.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                          <Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p className="text-lg font-medium mb-2">Start a conversation</p>
                          <p>Type a message below to begin chatting with {selectedModel.name}.</p>
                          {systemPrompt && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                              <p className="text-sm text-blue-800 font-medium">System Prompt:</p>
                              <p className="text-xs text-blue-700 mt-1">{systemPrompt}</p>
                            </div>
                          )}
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
                                <div className="text-sm font-medium mb-1 flex items-center space-x-2">
                                  <span>{message.role === 'user' ? 'You' : selectedModel?.name || 'Assistant'}</span>
                                  {message.finish_reason && message.finish_reason !== 'stop' && (
                                    <Badge variant="outline" className="text-xs">
                                      {message.finish_reason}
                                    </Badge>
                                  )}
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
                        placeholder={`Type your message to ${selectedModel.name}...`}
                        className="min-h-20 resize-none"
                        disabled={loading}
                        data-testid="chat-input"
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-500 flex items-center space-x-4">
                          <span>{prompt.length} characters</span>
                          {conversationMode === "conversation" && messages.length > 0 && (
                            <span className="text-blue-600">• Context: {messages.length} messages</span>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          disabled={loading || !prompt.trim() || !selectedModel}
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextPlayground;