import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Meals from "./Meals";

import AddMeal from "./AddMeal";

import NutritionistChat from "./NutritionistChat";

import InitialQuestionnaire from "./InitialQuestionnaire";

import EditProfile from "./EditProfile";

import WeightTracker from "./WeightTracker";

import NutritionInsights from "./NutritionInsights";

import MealGallery from "./MealGallery";

import Welcome from "./Welcome";

import AppleHealthInfo from "./AppleHealthInfo";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Meals: Meals,
    
    AddMeal: AddMeal,
    
    NutritionistChat: NutritionistChat,
    
    InitialQuestionnaire: InitialQuestionnaire,
    
    EditProfile: EditProfile,
    
    WeightTracker: WeightTracker,
    
    NutritionInsights: NutritionInsights,
    
    MealGallery: MealGallery,
    
    Welcome: Welcome,
    
    AppleHealthInfo: AppleHealthInfo,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Meals" element={<Meals />} />
                
                <Route path="/AddMeal" element={<AddMeal />} />
                
                <Route path="/NutritionistChat" element={<NutritionistChat />} />
                
                <Route path="/InitialQuestionnaire" element={<InitialQuestionnaire />} />
                
                <Route path="/EditProfile" element={<EditProfile />} />
                
                <Route path="/WeightTracker" element={<WeightTracker />} />
                
                <Route path="/NutritionInsights" element={<NutritionInsights />} />
                
                <Route path="/MealGallery" element={<MealGallery />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
                <Route path="/AppleHealthInfo" element={<AppleHealthInfo />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}