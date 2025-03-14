import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function ChatBubble({ message, isLastMessage }) {
  const isUser = message.sender === "user";
  const timestamp = new Date(message.timestamp);
  const formattedTime = format(timestamp, "HH:mm", { locale: he });

  // Check if message contains a confirmation code
  const hasMealConfirmation = message.content.includes("__meal_confirmation_");
  const cleanContent = hasMealConfirmation 
    ? message.content.replace(/__meal_confirmation_\d+__/g, '') 
    : message.content;

  // Function to render content
  const renderContent = () => {
    if (isUser) {
      return <div className="whitespace-pre-wrap">{cleanContent}</div>;
    }
    
    // Simple formatting without complex regex
    let formattedContent = cleanContent;
    
    // Replace ** with bold
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, (_, text) => 
      `<strong class="font-bold">${text}</strong>`
    );
    
    // Replace ## headers
    formattedContent = formattedContent.replace(/##\s(.*?)(\n|$)/g, (_, text) => 
      `<h2 class="text-lg font-bold my-2">${text}</h2>`
    );
    
    // Add spacing for paragraphs
    formattedContent = formattedContent.replace(/\n\n/g, '<div class="my-2"></div>');
    
    return (
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 sm:mb-4`}>
      <div className={`flex items-start ${isUser ? "flex-row-reverse" : ""} max-w-[90%] sm:max-w-[75%]`}>
        {!isUser && (
          <div className={`${isUser ? "ml-2" : "mr-2"} flex-shrink-0`}>
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/744145_av1.jpg" />
              <AvatarFallback className="bg-green-100 text-green-600 text-xs">תז</AvatarFallback>
            </Avatar>
          </div>
        )}
        <div 
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
            isUser 
              ? "bg-blue-600 text-white rounded-br-none" 
              : "bg-white text-gray-800 rounded-tl-none shadow-sm"
          }`}
        >
          <div className="text-sm sm:text-base">
            {renderContent()}
          </div>
          <div className={`text-xs mt-1 ${isUser ? "text-blue-200" : "text-gray-500"}`}>
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
}