import React from "react";
import { Button } from "@/components/ui/button";
import { Coffee, Utensils, Cookie, Moon, SunDim, BarChart2 } from "lucide-react";

export default function SuggestionChip({ text, onClick }) {
  // Add icons for different meal types
  const getIcon = () => {
    switch(text) {
      case "ארוחת בוקר":
        return <Coffee className="w-3 h-3 ml-1" />;
      case "ארוחת צהריים":
        return <Utensils className="w-3 h-3 ml-1" />;
      case "ארוחת ביניים/חטיף":
        return <Cookie className="w-3 h-3 ml-1" />;
      case "ארוחת ערב":
        return <SunDim className="w-3 h-3 ml-1" />;
      case "נשנושי לילה":
        return <Moon className="w-3 h-3 ml-1" />;
      case "סיכום היום":
        return <BarChart2 className="w-3 h-3 ml-1" />;
      case "סיכום ביניים":
        return <BarChart2 className="w-3 h-3 ml-1" />;
      default:
        return null;
    }
  };

  return (
    <Button
      variant="outline"
      className="text-xs bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800 rounded-full py-1 px-2 h-auto m-1 whitespace-nowrap flex items-center"
      onClick={() => onClick(text)}
    >
      {getIcon()}
      {text}
    </Button>
  );
}