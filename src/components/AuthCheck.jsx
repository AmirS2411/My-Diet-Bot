import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Simple component to check if user is authenticated
export default function AuthCheck({ 
  children, 
  requireOnboarding = true,
  redirectTo = null,
  loadingComponent = null 
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // If onboarding is required and not completed, redirect
        if (requireOnboarding && !user.completed_onboarding) {
          if (redirectTo) {
            navigate(createPageUrl(redirectTo));
          } else {
            // Handle authentication directly in the layout
            // The user will be shown the onboarding flow
          }
        }
      } catch (error) {
        // Not authenticated, handle in layout
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, requireOnboarding, redirectTo]);

  if (loading) {
    return loadingComponent || (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return children;
}