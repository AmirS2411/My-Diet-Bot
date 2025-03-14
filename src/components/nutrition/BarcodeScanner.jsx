import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvokeLLM } from "@/api/integrations";
import { Loader2, Camera, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BarcodeScanner({ onCodeScanned, onClose }) {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);
    
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          
          // Give the camera some time to start up before scanning
          setTimeout(scanCode, 1000);
        }
      } else {
        throw new Error("גישה למצלמה לא נתמכת בדפדפן זה");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("לא ניתן לגשת למצלמה. אנא ודא שאישרת גישה למצלמה.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const scanCode = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    // Check if video is ready
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        // Convert canvas to base64 image
        const imageData = canvas.toDataURL('image/jpeg');
        
        // Use LLM to detect barcode from image
        setIsFetchingData(true);
        const response = await InvokeLLM({
          prompt: `This is an image of a barcode. Please identify the barcode number (digits only). If you can't identify a barcode clearly, just respond with "BARCODE_NOT_FOUND". Provide nothing else in your response other than the barcode number or BARCODE_NOT_FOUND.`,
          file_urls: imageData
        });
        
        // Process response
        const barcode = response.trim();
        
        if (barcode !== "BARCODE_NOT_FOUND" && /^\d+$/.test(barcode)) {
          console.log("Barcode detected:", barcode);
          await fetchFoodData(barcode);
          return;
        }
      } catch (err) {
        console.error("Error processing barcode:", err);
      } finally {
        setIsFetchingData(false);
      }
    }
    
    // Continue scanning if no barcode found
    if (isScanning) {
      requestAnimationFrame(scanCode);
    }
  };

  const fetchFoodData = async (barcode) => {
    try {
      setIsFetchingData(true);
      
      // Use LLM to fetch nutrition data based on barcode
      const response = await InvokeLLM({
        prompt: `I need detailed nutritional information for a food product with barcode ${barcode}. 
        As if you're a nutritionist, extract this information from known food databases to the best of your knowledge.
        
        If you can find the product, provide the following in JSON format:
        1. Product name (in Hebrew)
        2. Calories per serving
        3. Protein content in grams
        4. Serving size (e.g., "100g", "1 piece")
        5. Brand or manufacturer (if available)
        
        For example:
        {
          "product_name": "שם המוצר בעברית",
          "calories": 250,
          "protein": 5,
          "serving_size": "100 גרם",
          "brand": "שם החברה",
          "found": true
        }
        
        If you cannot find this specific barcode in your knowledge, make an intelligent guess based on common food products with similar barcodes or formats, and include "found": false in your response.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            calories: { type: "number" },
            protein: { type: "number" },
            serving_size: { type: "string" },
            brand: { type: "string" },
            found: { type: "boolean" }
          }
        }
      });
      
      // Process food data
      stopScanner();
      onCodeScanned(barcode, response);
      
    } catch (err) {
      console.error("Error fetching food data:", err);
      setError("אירעה שגיאה בעת חיפוש מידע על המוצר");
      
      // Continue scanning on error
      if (isScanning) {
        requestAnimationFrame(scanCode);
      }
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardContent className="p-0 relative">
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => {
              stopScanner();
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 text-center">
          <h3 className="font-medium text-lg mb-1">סריקת ברקוד</h3>
          <p className="text-sm text-gray-500 mb-2">כוון את המצלמה לברקוד של המוצר</p>
        </div>

        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            playsInline
            muted
          />
          <canvas 
            ref={canvasRef} 
            className="hidden" 
          />
          
          {/* Scanning guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-red-500 w-3/4 h-16 rounded-lg">
              {isFetchingData && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="p-4 flex justify-between">
          <Button 
            variant="outline"
            onClick={onClose}
          >
            ביטול
          </Button>
          <Button 
            disabled={isFetchingData}
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              if (isScanning) {
                stopScanner();
                setIsScanning(false);
              } else {
                startScanner();
                setIsScanning(true);
              }
            }}
          >
            {isScanning ? 
              <>הפסק סריקה</> : 
              <><Camera className="ml-2 h-4 w-4" /> התחל סריקה</>
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}