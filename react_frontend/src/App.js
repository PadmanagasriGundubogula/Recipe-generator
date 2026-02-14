// App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import RecipeCreator from "./RecipeCreator";
import RecipeResult from "./RecipeResult";
import SelectRelations from "./SelectRelations";
import History from "./History";
import Home from "./Home";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Contact from "./Contact";
import MobileBottomNav from "./MobileBottomNav";
import "./mobile-optimized.css";


function App() {
  const [lang, setLang] = useState("en");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("app_language");
    if (stored) setLang(stored);

    // Check login status on mount
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLangChange = (e) => {
    const value = e.target.value;
    setLang(value);
    localStorage.setItem("app_language", value);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="app-main-container">
      <Navbar
        lang={lang}
        handleLangChange={handleLangChange}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
      />

      <main className="content-area">
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} lang={lang} handleLangChange={handleLangChange} />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<Signup setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/page1" element={<RecipeCreator />} />
          <Route path="/page2" element={<RecipeResult lang={lang} />} />
          <Route path="/page3" element={<SelectRelations lang={lang} />} />
          <Route path="/history" element={<History />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default App;
