import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, Home, Zap, Image, Mic, Video } from "lucide-react";

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/text-playground", label: "Text", icon: Zap },
    { path: "/image-playground", label: "Image", icon: Image },
    { path: "/audio-playground", label: "Audio", icon: Mic },
    { path: "/video-playground", label: "Video", icon: Video },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">AI Hub</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 transition-all duration-200 ${
                      isActive 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md" 
                        : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" data-testid="mobile-menu-btn">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;