import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./config";
import "./History.css";

const History = () => {
    const [recipes, setRecipes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const userId = localStorage.getItem("user_id");
    const appLanguage = localStorage.getItem("app_language") || "en";

    const TEXTS = {
        en: {
            title: "Your Recipe History",
            subtitle: "Resume your culinary creations",
            noRecipes: "No recipes found. Start creating now!",
            resume: "Resume",
            remove: "Remove",
            removeConfirm: "Are you sure you want to delete this recipe?",
            searchPlaceholder: "Search for a recipe...",
            date: "Created on",
            type: "Type",
            loading: "Loading your recipes...",
            startNew: "Start New Recipe",
            download: "Download"
        },
        hi: {
            title: "आपकी रेसिपी हिस्ट्री",
            subtitle: "अपनी पाक कृतियों को फिर से शुरू करें",
            noRecipes: "कोई रेसिपी नहीं मिली। अभी बनाना शुरू करें!",
            resume: "जारी रखें",
            remove: "हटाएं",
            removeConfirm: "क्या आप वाकई इस रेसिपी को हटाना चाहते हैं?",
            searchPlaceholder: "रेसिपी खोजें...",
            date: "बनाया गया",
            type: "प्रकार",
            loading: "आपकी रेसिपी लोड हो रही है...",
            startNew: "नई रेसिपी शुरू करें",
            download: "डाउनलोड"
        }
    };

    const t = TEXTS[appLanguage] || TEXTS.en;

    const fetchRecipes = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/get-user-recipes/${userId}`);
            const data = await response.json();
            if (response.ok) {
                setRecipes(data);
            } else {
                setError(data.error || "Failed to fetch recipes");
            }
        } catch (err) {
            setError("Network error. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [userId, API_URL]);

    useEffect(() => {
        if (!userId) {
            navigate("/login");
            return;
        }
        fetchRecipes();
    }, [userId, navigate, API_URL, fetchRecipes]);

    const handleResume = (recipeId) => {
        localStorage.setItem("currentRecipeId", recipeId);
        navigate(`/page2?recipe_id=${recipeId}`);
    };

    const handleRemove = async (e, recipeId) => {
        e.stopPropagation();
        if (!window.confirm(t.removeConfirm)) return;

        try {
            const response = await fetch(`${API_URL}/remove-recipe/${recipeId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (response.ok) {
                // Refresh list
                fetchRecipes();
            } else {
                alert(data.error || data.message || "Failed to remove recipe.");
            }
        } catch (err) {
            console.error("Remove recipe fetch error:", err);
            alert("Error removing recipe. Please check your connection and try again.");
        }
    };

    const handleDownload = async (e, recipe) => {
        e.stopPropagation();
        try {
            // 1. Fetch full recipe (for ingredients)
            const recipeResp = await fetch(`${API_URL}/get-recipe/${recipe.recipe_id}`);
            const recipeData = await recipeResp.json();

            // 2. Fetch sentences (steps)
            const sentencesResp = await fetch(`${API_URL}/get-sentences-with-id/${recipe.recipe_id}`);
            const sentencesData = await sentencesResp.json();

            try {
                // If there's a stored running text in the backend or local (this might need backend support if not stored)
                // For now, we use the steps we have.
            } catch (e) { }

            const ingredients = Array.isArray(recipeData.ingredients) ? recipeData.ingredients.join(", ") : "N/A";
            const steps = Array.isArray(sentencesData.instructions)
                ? sentencesData.instructions.map((s, idx) => `${idx + 1}. ${s.text}`).join("\n")
                : "No steps generated yet.";

            let content = `RECIPE DETAILS\n` +
                `====================\n` +
                `Name: ${recipe.recipe_name}\n` +
                `Type: ${recipe.recipe_type}\n` +
                `duration to cook : ${recipeData.cooking_time || "N/A"}minutes\n` +
                `Created At: ${new Date(recipe.created_at).toLocaleString()}\n` +
                `INGREDIENTS:\n` +
                `${ingredients}\n\n` +
                `STEPS:\n` +
                `${steps}\n\n` +
                `Generated with Recipe Generator 🍴`;

            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${recipe.recipe_name.replace(/\s+/g, "_")}_recipe.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download recipe. Please try again.");
        }
    };

    const filteredRecipes = recipes.filter(r =>
        r.recipe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.recipe_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="history-container">
                <div className="loading-state">{t.loading}</div>
            </div>
        );
    }

    return (
        <div className="history-container">
            <div className="history-header">
                <h1>{t.title}</h1>
                <p>{t.subtitle}</p>
            </div>

            <div className="history-search-container">
                <input
                    type="text"
                    className="history-search-bar"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            {recipes.length === 0 ? (
                <div className="no-recipes">
                    <p>{t.noRecipes}</p>
                    <button className="btn-primary" onClick={() => navigate("/page1")}>
                        {t.startNew}
                    </button>
                </div>
            ) : (
                <>
                    {filteredRecipes.length === 0 ? (
                        <div className="no-recipes">
                            <p>No recipes match your search.</p>
                        </div>
                    ) : (
                        <div className="recipe-grid">
                            {filteredRecipes.map((recipe) => (
                                <div key={recipe.recipe_id} className="recipe-history-card">
                                    <div className="recipe-card-content" onClick={() => handleResume(recipe.recipe_id)}>
                                        <h3>{recipe.recipe_name}</h3>
                                        <p className="recipe-type">
                                            <strong>{t.type}:</strong> {recipe.recipe_type}
                                        </p>
                                        <p className="recipe-date">
                                            <strong>{t.date}:</strong> {new Date(recipe.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="recipe-card-actions">
                                        <button
                                            className="remove-btn"
                                            onClick={(e) => handleRemove(e, recipe.recipe_id)}
                                        >
                                            {t.remove}
                                        </button>
                                        <button
                                            className="resume-btn"
                                            onClick={() => handleResume(recipe.recipe_id)}
                                        >
                                            {t.resume}
                                        </button>
                                        <button
                                            className="download-btn"
                                            onClick={(e) => handleDownload(e, recipe)}
                                        >
                                            {t.download}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default History;
