import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Link as LinkIcon,
  CheckCircle,
  X
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ShareOptions({ title, description, imageUrl = null, achievementType = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  const shareUrl = window.location.href;
  
  // Prepare share text based on type
  const getShareText = () => {
    let text = '';
    
    if (achievementType === 'weight') {
      text = `${title} - ${description} עם האפליקציה "התזונאי האישי"! 💪`;
    } else if (achievementType === 'meal') {
      text = `הארוחה שהכנתי היום: ${title} - ${description} קלוריות. 🥗 מנהל/ת את התזונה שלי עם "התזונאי האישי"!`;
    } else if (achievementType === 'streak') {
      text = `${title} - ${description} ימים רצופים של תיעוד תזונה עם "התזונאי האישי"! 🔥`;
    } else {
      text = `${title} - ${description} עם האפליקציה "התזונאי האישי"!`;
    }
    
    return encodeURIComponent(text);
  };
  
  const shareText = getShareText();
  
  // Share to specific platforms
  const shareTo = (platform) => {
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${shareText}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${shareText}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }
    
    // Open share link in a new window
    window.open(shareLink, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };
  
  // Copy link to clipboard
  const copyToClipboard = () => {
    const textToCopy = `${title} - ${description}\n${shareUrl}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      });
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4 ml-1" />
            שתף
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>שתף עם חברים</DialogTitle>
            <DialogDescription>
              שתף את ההישג או הארוחה שלך ברשתות החברתיות
            </DialogDescription>
          </DialogHeader>
          
          {imageUrl && (
            <div className="flex justify-center my-4">
              <img 
                src={imageUrl} 
                alt={title} 
                className="max-h-48 rounded-md shadow-sm" 
              />
            </div>
          )}
          
          <div className="flex flex-col">
            <div className="flex justify-between items-center gap-4 px-2">
              <Button
                variant="outline"
                className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-100"
                onClick={() => shareTo('facebook')}
              >
                <Facebook className="h-5 w-5 text-blue-600" />
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-sky-50 hover:bg-sky-100 border-sky-100"
                onClick={() => shareTo('twitter')}
              >
                <Twitter className="h-5 w-5 text-sky-500" />
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-pink-50 hover:bg-pink-100 border-pink-100"
                onClick={() => shareTo('instagram')}
              >
                <Instagram className="h-5 w-5 text-pink-600" />
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-100"
                onClick={() => shareTo('linkedin')}
              >
                <Linkedin className="h-5 w-5 text-blue-700" />
              </Button>
            </div>
            
            <div className="relative mt-4">
              <Button 
                variant="outline" 
                className="w-full justify-center mt-2"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                    הקישור הועתק
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 ml-2" />
                    העתק קישור
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {showAlert && (
        <Alert className="fixed bottom-4 right-4 w-auto z-50 bg-white shadow-lg border-red-200">
          <X className="h-4 w-4 text-red-500" />
          <AlertDescription>לא ניתן להעתיק את הקישור</AlertDescription>
        </Alert>
      )}
    </>
  );
}