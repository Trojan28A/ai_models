import { AlertCircle, RefreshCw, Settings, CreditCard, Upload, Clock, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const ErrorDisplay = ({ error, onRetry, onSwitchModel }) => {
  if (!error) return null;

  const getErrorIcon = (type) => {
    switch (type) {
      case "network_error":
      case "check_connection":
        return <WifiOff className="w-6 h-6 text-red-500" />;
      case "rate_limit":
      case "wait_or_upgrade":
        return <Clock className="w-6 h-6 text-amber-500" />;
      case "no_api_key":
      case "auth_error":
      case "add_api_key":
      case "update_api_key":
        return <Settings className="w-6 h-6 text-blue-500" />;
      case "insufficient_credits":
      case "add_credits":
      case "upgrade_plan":
        return <CreditCard className="w-6 h-6 text-purple-500" />;
      case "model_not_found":
      case "model_unavailable":
      case "switch_model":
        return <Upload className="w-6 h-6 text-orange-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getActionButton = (action, type) => {
    switch (action) {
      case "add_api_key":
      case "update_api_key":
        return (
          <Link to="/settings">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          </Link>
        );
      
      case "switch_model":
        return onSwitchModel ? (
          <Button onClick={onSwitchModel} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Switch Model
          </Button>
        ) : null;
      
      case "retry":
      case "check_connection":
        return onRetry ? (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        ) : null;
      
      case "wait_or_upgrade":
      case "upgrade_plan":
      case "add_credits":
        return (
          <div className="flex space-x-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button 
              onClick={() => window.open("https://www.a4f.co/pricing", "_blank")} 
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        );
      
      case "retry_later":
        return (
          <div className="text-sm text-slate-600 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Please wait a few minutes and try again
          </div>
        );
      
      default:
        return onRetry ? (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        ) : null;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case "network_error":
        return "border-red-200 bg-red-50";
      case "rate_limit":
      case "wait_or_upgrade":
        return "border-amber-200 bg-amber-50";
      case "no_api_key":
      case "auth_error":
        return "border-blue-200 bg-blue-50";
      case "insufficient_credits":
        return "border-purple-200 bg-purple-50";
      case "model_not_found":
      case "model_unavailable":
        return "border-orange-200 bg-orange-50";
      default:
        return "border-red-200 bg-red-50";
    }
  };

  return (
    <Card className={`${getBorderColor(error.type)} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getErrorIcon(error.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {error.message}
            </h3>
            <p className="text-slate-700 mb-4">
              {error.suggestion}
            </p>
            <div className="flex items-center space-x-3">
              {getActionButton(error.action, error.type)}
            </div>
          </div>
        </div>
        
        {/* Additional help based on error type */}
        {error.type === "no_api_key" && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>How to get an A4F API key:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-1 ml-4 list-decimal">
              <li>Visit <a href="https://www.a4f.co" target="_blank" rel="noopener noreferrer" className="underline">a4f.co</a> and create an account</li>
              <li>Go to your dashboard and generate an API key</li>
              <li>Copy the key and paste it in Settings</li>
            </ol>
          </div>
        )}
        
        {error.type === "rate_limit" && (
          <div className="mt-4 p-3 bg-amber-100 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Rate limit reached:</strong> You've used up your daily quota for this model. 
              You can either wait until tomorrow, upgrade your plan, or try a different model.
            </p>
          </div>
        )}
        
        {error.type === "model_unavailable" && (
          <div className="mt-4 p-3 bg-orange-100 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Model Status:</strong> The selected model is temporarily down for maintenance. 
              Try selecting a different model or check the A4F status page for updates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;