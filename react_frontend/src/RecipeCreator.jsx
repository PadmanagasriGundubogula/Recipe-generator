// src/RecipeCreator.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X } from "lucide-react";
import { API_URL } from "./config";
import "./recipe.css";

// LANGUAGE TEXTS
const TEXTS = {
  en: {
    recipeCreator: "Recipe Creator 🍴",
    selectType: "Select Recipe Type",
    enterName: "Enter Your Recipe Name",
    placeholder: "e.g., Lemon Rice",
    generate: "Generate Recipe",
    footer: "Made with 💕 by Padma",
    suggestions: "Suggested for you",
    selectedIngredients: "Your Ingredients",
    addMore: "Add custom ingredient",
    searchPlaceholder: "Search ingredients...",
    cookingTime: "Cooking Time (minutes)",
    cookingTimePlaceholder: "e.g., 20",
  },
  hi: {
    recipeCreator: "रेसिपी क्रिएटर 🍴",
    selectType: "रेसिपी प्रकार चुनें",
    enterName: "अपनी रेसिपी का नाम दर्ज करें",
    placeholder: "जैसे, लेमन राइस",
    generate: "रेसिपी बनाएं",
    footer: "पद्मा द्वारा बनाया गया 💕",
    suggestions: "आपके लिए सुझाव",
    selectedIngredients: "आपकी सामग्री",
    addMore: "कस्टम सामग्री जोड़ें",
    searchPlaceholder: "सामग्री खोजें...",
    cookingTime: "पकाने का समय (मिनट)",
    cookingTimePlaceholder: "जैसे, 20",
  },
};

const SUGGESTED_INGREDIENTS = {
  breakfast: ["Egg", "Milk", "Bread", "Butter", "Cheese", "Oats", "Yogurt", "Tea", "Coffee", "Poha", "Upma"],
  lunch: ["Rice", "Dal", "Wheat Floor", "Oil", "Garlic", "Salt", "Onion", "Tomato", "Potato", "Paneer", "Chicken"],
  dinner: ["Rice", "Dal", "Roti", "Oil", "Garlic", "Ginger", "Pepper", "Vegetables", "Fish", "Meat"],
  dessert: ["Sugar", "Milk", "Cream", "Butter", "Chocolate", "Honey", "Vanilla", "Flour", "Eggs", "Nuts"],
};

export default function RecipeCreator() {
  const [selectedType, setSelectedType] = useState("");
  const appLanguage = localStorage.getItem("app_language") || "en";
  const T = TEXTS[appLanguage];
  const [recipeName, setRecipeName] = useState("");
  const [allIngredients, setAllIngredients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [customIngredient, setCustomIngredient] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [showAllInPalette, setShowAllInPalette] = useState(false);
  const navigate = useNavigate();

  const recipeTypes = [
    { label: "🍳 Breakfast", value: "breakfast" },
    { label: "🍛 Lunch", value: "lunch" },
    { label: "🍽️ Dinner", value: "dinner" },
    { label: "🍰 Dessert", value: "dessert" },
  ];

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("No user found. Please log in first.");
      navigate("/");
    }

    const fetchIngredients = async () => {
      try {
        const response = await fetch(`${API_URL}/get-all-items?type=ingredient`);
        const data = await response.json();
        const combined = [...data.default, ...data.custom];
        const unique = Array.from(new Set(combined.map(a => a.name)))
          .map(name => combined.find(a => a.name === name));
        setAllIngredients(unique);
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      }
    };
    fetchIngredients();
  }, [navigate]);

  const handleToggleIngredient = (ingName) => {
    setSelectedIngredients(prev =>
      prev.includes(ingName)
        ? prev.filter(i => i !== ingName)
        : [...prev, ingName]
    );
  };

  const handleAddCustom = () => {
    const trimmed = customIngredient.trim();
    if (trimmed && !selectedIngredients.includes(trimmed)) {
      setSelectedIngredients(prev => [...prev, trimmed]);
      setCustomIngredient("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType) {
      alert("Please select a recipe type.");
      return;
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("No user found. Please log in again.");
      navigate("/");
      return;
    }

    const recipeData = {
      user_id: userId,
      recipe_type: selectedType,
      recipe_name: recipeName.trim(),
      ingredients: selectedIngredients,
      cooking_time: cookingTime,
    };

    try {
      const response = await fetch(`${API_URL}/save-recipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(recipeData),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem("currentRecipeId", result.recipe_id);
        navigate(`/page2?recipe_id=${result.recipe_id}`);
      } else {
        alert(result.error || "Failed to save recipe.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const filteredSuggestions = (SUGGESTED_INGREDIENTS[selectedType] || []).filter(
    (ing) => !selectedIngredients.includes(ing)
  );

  // Merge database ingredients with hardcoded suggestions for a complete search pool
  const allSearchable = React.useMemo(() => {
    // 1. Database items
    const dbItems = allIngredients.map(i => ({ name: i.name, isFromDb: true }));

    // 2. Hardcoded suggestions for current type
    const suggestions = (SUGGESTED_INGREDIENTS[selectedType] || []).map(s => ({ name: s, isFromDb: false }));

    // Combine and make unique
    const combined = [...dbItems, ...suggestions];
    return Array.from(new Set(combined.map(c => c.name.toLowerCase())))
      .map(name => combined.find(c => c.name.toLowerCase() === name));
  }, [allIngredients, selectedType]);

  const searchedIngredients = allSearchable.filter(ing =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedIngredients.some(s => s.toLowerCase() === ing.name.toLowerCase())
  );

  return (
    <div className="recipe-page">
      <div className="recipe-card glassmorphism">
        <div className="image-side">
          <img
            src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1200&q=80"
            alt="Recipe illustration"
            className="header-image"
          />
          <div className="image-overlay">
            <h2>{T.recipeCreator}</h2>
          </div>
        </div>

        <div className="content-side">
          <form onSubmit={handleSubmit} className="recipe-form">
            {/* TYPE SELECTION */}
            <div className="field-group animate-slide-up">
              <label className="field-label">{T.selectType}</label>
              <div className="recipe-types-grid">
                {recipeTypes.map((item) => (
                  <div
                    key={item.value}
                    className={`type-box-card ${selectedType === item.value ? "selected" : ""}`}
                    onClick={() => setSelectedType(item.value)}
                  >
                    <div className="type-image">
                      {item.value === 'breakfast' && <img src="https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=300&q=60" alt="Breakfast" />}
                      {item.value === 'lunch' && <img src="https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=300&q=60" alt="Lunch" />}
                      {item.value === 'dinner' && <img src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=60" alt="Dinner" />}
                      {item.value === 'dessert' && <img src="https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300&q=60" alt="Dessert" />}
                    </div>
                    <span className="type-label-text">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NAME INPUT */}
            <div className="field-group animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label className="field-label">{T.enterName}</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  placeholder={T.placeholder}
                  required
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="recipe-input"
                />
              </div>
            </div>

            {/* COOKING TIME INPUT */}
            <div className="field-group animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label className="field-label">{T.cookingTime}</label>
              <div className="input-with-icon">
                <input
                  type="number"
                  placeholder={T.cookingTimePlaceholder}
                  required
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  className="recipe-input"
                  min="1"
                />
              </div>
            </div>

            {/* INGREDIENTS SECTION */}
            <div className="field-group animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <label className="field-label">{T.selectedIngredients}</label>

              {/* Selected Ingredients Tags */}
              <div className="tags-container">
                {selectedIngredients.map(ing => (
                  <span key={ing} className="ing-tag selected animate-pop">
                    {ing}
                    <button type="button" onClick={() => handleToggleIngredient(ing)}><X size={14} /></button>
                  </span>
                ))}
                {selectedIngredients.length === 0 && <p className="no-items-text">No ingredients selected yet.</p>}
              </div>

              {/* Suggested Ingredients */}
              {selectedType && filteredSuggestions.length > 0 && (
                <div className="suggestions-box">
                  <p className="small-label">{T.suggestions}:</p>
                  <div className="tags-container compact">
                    {filteredSuggestions.map(ing => (
                      <span key={ing} className="ing-tag suggestion" onClick={() => handleToggleIngredient(ing)}>
                        <Plus size={12} style={{ marginRight: '4px' }} /> {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Search & Add */}
              <div className="search-add-container">
                <div className="search-bar-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder={T.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="recipe-input-small"
                  />
                  {searchQuery && searchedIngredients.length > 0 && (
                    <div className="search-results-dropdown">
                      {searchedIngredients.slice(0, 5).map(ing => (
                        <div key={ing.name} className="search-result-item" onClick={() => { handleToggleIngredient(ing.name); setSearchQuery(""); }}>
                          <Plus size={14} style={{ marginRight: '8px', color: 'var(--primary)' }} />
                          {ing.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="custom-add-wrapper">
                  <input
                    type="text"
                    placeholder={T.addMore}
                    value={customIngredient}
                    onChange={(e) => setCustomIngredient(e.target.value)}
                    className="recipe-input-small"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
                  />
                  <button type="button" onClick={handleAddCustom} className="action-btn-circle" title="Add Ingredient">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="generate-btn glow-effect">
              {T.generate}
            </button>
          </form>

          <footer className="creator-footer">
            <p>{T.footer}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
