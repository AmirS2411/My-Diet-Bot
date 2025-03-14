import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Scale, MessageCircle, Apple, Utensils, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
    title: "תזונאי אישי חכם",
    description: "קבל תמיכה וייעוץ אישי לגבי תזונה בריאה ויעדי הירידה במשקל שלך"
  },
  {
    icon: <Scale className="w-8 h-8 text-green-500" />,
    title: "מעקב משקל מתקדם",
    description: "עקוב אחר ההתקדמות שלך עם גרפים ותובנות מפורטות"
  },
  {
    icon: <Utensils className="w-8 h-8 text-purple-500" />,
    title: "תיעוד ארוחות פשוט",
    description: "תעד ארוחות בקלות עם זיהוי תמונות אוטומטי וניתוח ערכים תזונתיים"
  },
  {
    icon: <Apple className="w-8 h-8 text-red-500" />,
    title: "תובנות תזונה מותאמות אישית",
    description: "קבל המלצות המותאמות ספציפית לאורח החיים והיעדים שלך"
  }
];

export default function Welcome() {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await User.me();
        // If we get here, user is logged in, redirect to main page
        navigate(createPageUrl("NutritionistChat"));
      } catch (error) {
        // User is not logged in, show welcome page
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await User.login();
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
    }
  };

  const nextFeature = () => {
    setCurrentFeature(prev => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature(prev => (prev - 1 + features.length) % features.length);
  };

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1,

      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 10 }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    },
    tap: { scale: 0.98 }
  };

  const logoAnimation = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.2
      }
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4"
      dir="rtl"
      initial="hidden"
      animate="visible"
      variants={backgroundVariants}
    >
      <motion.div
        className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden"
        variants={containerVariants}
      >
        <div className="flex flex-col md:flex-row">
          {/* Left content - Features section */}
          <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-400 text-white p-8 relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute top-10 left-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
              <div className="absolute bottom-5 right-5 w-60 h-60 bg-blue-300 opacity-20 rounded-full"></div>
            </motion.div>
            
            <motion.h2 
              className="text-2xl font-bold mb-8 relative z-10"
              variants={itemVariants}
            >
              המסע שלך לחיים בריאים יותר מתחיל כאן
            </motion.h2>
            
            <div className="relative h-64 mb-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className={`absolute top-0 left-0 right-0 ${
                    currentFeature === index ? "opacity-100 z-10" : "opacity-0 z-0"
                  } transition-opacity duration-500`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ 
                    opacity: currentFeature === index ? 1 : 0,
                    x: currentFeature === index ? 0 : 50
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col items-center md:items-start text-center md:text-right mb-6">
                    <div className="p-3 bg-white/20 rounded-full mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-blue-100">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-center md:justify-start gap-4 relative z-10">
              <Button 
                onClick={prevFeature} 
                variant="ghost" 
                size="icon" 
                className="border border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="flex gap-1">
                {features.map((_, index) => (
                  <span 
                    key={index} 
                    className={`block w-2 h-2 rounded-full ${
                      currentFeature === index ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <Button 
                onClick={nextFeature} 
                variant="ghost" 
                size="icon" 
                className="border border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Right content - Login section */}
          <div className="md:w-1/2 p-8 flex flex-col items-center justify-center">
            <motion.div
              className="bg-blue-50 p-4 rounded-full mb-6"
              variants={logoAnimation}
            >
              <motion.img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/744145_avo.png" 
                alt="My Diet Bot Logo" 
                className="w-20 h-20 object-contain"
                animate={{ 
                  y: [0, -5, 0],
                  rotate: [0, -3, 3, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </motion.div>
            
            <motion.h1 
              className="text-3xl font-bold text-gray-800 mb-3 text-center"
              variants={itemVariants}
            >
              ברוכים הבאים ל-My Diet Bot
            </motion.h1>
            
            <motion.p 
              className="text-gray-600 mb-8 text-center"
              variants={itemVariants}
            >
              הדרך החכמה לנהל תזונה, לעקוב אחר משקל ולהשיג את יעדי הבריאות שלך
            </motion.p>
            
            <motion.div 
              className="w-full max-w-xs mb-4"
              variants={itemVariants}
            >
              <motion.button
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 rounded-lg py-3 px-4 shadow-sm hover:shadow-md transition-all"
                onClick={handleLogin}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 186.69 190.5"><g transform="translate(1184.583 765.171)"><path fill="#4285f4" d="M-1089.333-687.239v36.888h51.262c-2.251 11.863-9.006 21.908-19.137 28.662l30.913 23.986c18.011-16.625 28.402-41.044 28.402-70.052 0-6.754-.606-13.249-1.732-19.483z"/><path fill="#34a853" d="M-1142.714-651.791l-6.972 5.337-24.679 19.223h0c15.673 31.086 47.796 52.561 85.03 52.561 25.717 0 47.278-8.486 63.038-23.033l-30.913-23.986c-8.486 5.715-19.31 9.179-32.125 9.179-24.765 0-45.806-16.712-53.34-39.226z"/><path fill="#fbbc05" d="M-1174.365-712.61c-6.494 12.815-10.217 27.276-10.217 42.689s3.723 29.874 10.217 42.689c0 .086 31.693-24.592 31.693-24.592-1.905-5.715-3.031-11.776-3.031-18.098s1.126-12.383 3.031-18.098z"/><path fill="#ea4335" d="M-1089.333-727.244c14.028 0 26.497 4.849 36.455 14.201l27.276-27.276c-16.539-15.413-38.013-24.852-63.731-24.852-37.234 0-69.359 21.388-85.032 52.561l31.692 24.592c7.533-22.514 28.575-39.226 53.34-39.226z"/></g></svg>
                    התחבר עם גוגל
                  </>
                )}
              </motion.button>
            </motion.div>
            
            <motion.div
              className="text-xs text-gray-500 text-center max-w-xs"
              variants={itemVariants}
            >
              <p>בהתחברות, אתה מסכים לתנאי השימוש ולמדיניות הפרטיות שלנו.</p>
              <p className="mt-2">אנחנו משתמשים בטכנולוגיות AI מתקדמות כדי לסייע לך להשיג את יעדי הבריאות שלך</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      <motion.footer 
        className="mt-8 text-gray-500 text-sm text-center"
        variants={itemVariants}
      >
        <p>Created with 💙 by Amir Shneider</p>
      </motion.footer>
    </motion.div>
  );
}