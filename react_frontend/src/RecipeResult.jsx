// RecipeResult.jsx (RecipeVisualBuilder)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { API_URL } from "./config";
import "./recipeResult.css";
import AudioInput from "./AudioInput";
import GuidedAudioInput from "./GuidedAudioInput";
import { translateText } from "./translate";

/* ====================== UNIT DROPDOWN COMPONENT ====================== */

const unitCategories = {
  "Volume Units": [
    "liter",
    "milliliter",
    "cup",
    "tablespoon",
    "teaspoon",
    "dash",
    "pinch",
    "drop",
    "pint",
    "quart",
    "gallon",
    "shot",
    "splash",
  ],
  "Weight Units": ["gram", "kilogram", "milligram", "pound", "ounce"],
  "Count Units": [
    "piece",
    "pieces",
    "whole",
    "bunch",
    "clove",
    "pod",
    "slice",
    "stick",
    "leaf",
    "leaves",
    "handful",
  ],
  "Time Units": ["second", "minute", "hour", "overnight"],
  "Temperature Units": ["degree_Celsius", "degree_Fahrenheit"],
  "Shape / Size Units": [
    "small_size",
    "medium_size",
    "large_size",
    "ladle",
    "scoop",
    "sprinkle",
  ],
  "Quantity Modifiers": [
    "some",
    "little",
    "few",
    "as_needed",
    "taste",
    "as_required",
  ],

};

function UnitDropdown({ value, onSelect, unitCategories: categoriesProp }) {
  // allow caller to pass a categories object, otherwise fall back to default
  const categories = categoriesProp || unitCategories;

  const [open, setOpen] = useState(false);
  const [hoverGroup, setHoverGroup] = useState(null);

  return (
    <div className="unit-dropdown">
      <div
        className="unit-dropdown-selected"
        onClick={() => setOpen((s) => !s)}
      >
        <span style={{ marginRight: 8 }}>{value || "-"}</span>
        <span style={{ fontSize: "0.9rem" }}>▼</span>
        {value && (
          <button
            className="unit-clear"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onSelect === "function") onSelect("");
            }}
            title="Clear unit"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="unit-dropdown-menu">
          {Object.keys(categories).map((group) => (
            <div
              key={group}
              className="unit-group"
              onMouseEnter={() => setHoverGroup(group)}
              onMouseLeave={() => setHoverGroup(null)}
            >
              <div className="unit-group-name">{group} ➤</div>

              {hoverGroup === group && (
                <div className="unit-submenu">
                  {categories[group].map((unit) => (
                    <div
                      key={unit}
                      className="unit-item"
                      onClick={() => {
                        if (typeof onSelect === "function") onSelect(unit);
                        setOpen(false);
                      }}
                    >
                      {unit}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* =================== END UNIT DROPDOWN COMPONENT ===================== */

/* ========= SIMPLE UI TRANSLATIONS ========= */

const UI_STRINGS = {
  en: {
    backToRecipes: "Back to Recipes",
    typeLabel: "Type",
    dragTitle: "Click from left → add to builder",
    dragSubtitle: "Actions, ingredients, descriptors & objects",
    actionsTitle: "Actions",
    ingredientsTitle: "Ingredients",
    descriptorsTitle: "Descriptors",
    otherEntitiesTitle: "Other Entities",
    relationsTitle: "Relations",
    instructionBuilderTitle: "Instruction Builder",
    verbsTitle: "State",
    instructionBuilderSubtitle:
      "Click components from the left & build the cooking step",
    dropTitle: "Click items to build your instruction",
    placeholderText: "Start by clicking an action, ingredient or descriptor…",
    clearAll: "Clear All",
    generateInstruction: "Generate Sentence",
    addNewInstruction: "Add New Sentence (नया वाक्य)",
    stepsForRecipe: "History of Recipe Generation",
    generatedGraph: "Generated Graph",
    generatedUSR: "Generated USR",
    sentencesGenerated: "Sentences Generated",
    submit: "Add Discourse / Next Page",
    goBack: "Go Back",
    stepLabel: "Step",
    recipesTitle: "Recipes",
    finalCheckTitle: "Final check",
    finalCheckBody:
      'Want to add more? Click "Back to Edit" or click "Continue to Submit"',
    backToEdit: "Back to Edit",
    continueToSubmit: "Continue to Submit",
  },
  hi: {
    backToRecipes: "रेसिपी पर वापस जाएँ",
    typeLabel: "प्रकार",
    dragTitle: "बाएँ से क्लिक करें → बिल्डर में जोड़ें",
    dragSubtitle: "क्रियाएँ, सामग्री, विवरण और वस्तुएँ",
    actionsTitle: "क्रियाएँ",
    ingredientsTitle: "सामग्री",
    descriptorsTitle: "विवरण",
    otherEntitiesTitle: "अन्य इकाइयाँ",
    relationsTitle: "संबंध",
    instructionBuilderTitle: "निर्देश तैयारकर्ता",
    verbsTitle: "क्रिया",
    instructionBuilderSubtitle:
      "बाएँ से घटक पर क्लिक करें और कुकिंग स्टेप बनाएं",
    dropTitle: "गठन के लिए आइटम पर क्लिक करें",
    dropHelper: "TAM वाली क्रिया + सामग्री + संबंध",
    placeholderText:
      "शुरू करने के लिए कोई क्रिया, सामग्री या विवरण पर क्लिक करें…",
    clearAll: "सब साफ करें",
    generateInstruction: "वाक्य बनाएँ",
    addNewInstruction: "नया वाक्य जोड़ें",
    stepsForRecipe: "इस रेसिपी के लिए स्टेप्स",
    generatedGraph: "बना हुआ ग्राफ",
    generatedUSR: "बना हुआ USR",
    sentencesGenerated: "बने हुए वाक्य",
    submit: "जमा करें",
    goBack: "वापस जाएँ",
    stepLabel: "स्टेप",
    recipesTitle: "रेसिपी",
    finalCheckTitle: "अंतिम जाँच",
    finalCheckBody:
      'और स्टेप जोड़ने हैं? "Back to Edit" या "Continue to Submit" पर क्लिक करें',
    backToEdit: "वापस जाकर बदलें",
    continueToSubmit: "जारी रखें और जमा करें",
  },
};

const RecipeVisualBuilder = ({ lang }) => {
  const navigate = useNavigate();

  // current app language (prop → localStorage → en)
  const rawLang = lang || localStorage.getItem("app_language") || "en";
  const normLang = rawLang.toLowerCase().startsWith("hi") ? "hi" : "en";
  const activeLang = UI_STRINGS[normLang] ? normLang : "en";
  const t = (key) =>
    (UI_STRINGS[activeLang] && UI_STRINGS[activeLang][key]) ||
    UI_STRINGS.en[key] ||
    key;

  const [paletteTab, setPaletteTab] = useState("actions"); // mobile only
  const [outputTab, setOutputTab] = useState("usr"); // mobile only


  // ==== STATE ====
  const [recipeName, setRecipeName] = useState("");
  const [recipeType, setRecipeType] = useState("");
  const [recipeDuration, setRecipeDuration] = useState("");
  const [currentInstruction, setCurrentInstruction] = useState([]);
  const [generatedInstructions, setGeneratedInstructions] = useState([]); // steps from DB (display language)
  const [pastInstructions, setPastInstructions] = useState([]); // objects with ids
  const [selectedSentenceId, setSelectedSentenceId] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [suggestedIngredients, setSuggestedIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [ingredientPaletteSearch, setIngredientPaletteSearch] = useState("");
  const [recipesSearch, setRecipesSearch] = useState("");
  const [actionsSearch, setActionsSearch] = useState("");
  const [descriptorsSearch, setDescriptorsSearch] = useState("");
  const [toolsSearch, setToolsSearch] = useState("");
  const [temporalSearch, setTemporalSearch] = useState("");
  const [relationsSearch, setRelationsSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("page1");
  const [userRecipes, setUserRecipes] = useState([]);
  const [showRecipes, setShowRecipes] = useState(true);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [modifyingSentenceId, setModifyingSentenceId] = useState(null);
  const [inherentRelation, setInherentRelation] = useState(null);

  const [actions, setActions] = useState([]);
  const [descriptors, setDescriptors] = useState([]);
  const [otherIngredients, setOtherIngredients] = useState([]);
  const [showAddValidationPopup, setShowAddValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  // TEMPORAL POPUP STATE
  const [showTemporalRelationPopup, setShowTemporalRelationPopup] = useState(false);
  const [selectedTemporalComponent, setSelectedTemporalComponent] = useState(null);
  const [selectedTemporalRelation, setSelectedTemporalRelation] = useState("");

  // Action Temporal Modifier Popup
  const [showActionTemporalPopup, setShowActionTemporalPopup] = useState(false);
  const [selectedActionTemporalModifier, setSelectedActionTemporalModifier] = useState("");
  const [pendingActionComponent, setPendingActionComponent] = useState(null);

  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [showDescriptorForm, setShowDescriptorForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [graphImage, setGraphImage] = useState("");
  const [usrTableHtml, setUsrTableHtml] = useState("");
  const [englishSentences, setEnglishSentences] = useState([]); // actually display-language sentences
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSemanticPopup, setShowSemanticPopup] = useState(false);
  const [pendingIngredient, setPendingIngredient] = useState(null);
  const [showTAMSelector, setShowTAMSelector] = useState(false);
  const [showDurationPopup, setShowDurationPopup] = useState(false);
  const [pendingDurationTemplate, setPendingDurationTemplate] = useState(null);
  const [durationNumberInput, setDurationNumberInput] = useState("");
  const [durationUnitInput, setDurationUnitInput] = useState("minutes");
  const [pendingAction, setPendingAction] = useState(null);
  const [showRelationPrompt, setShowRelationPrompt] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false); // zoom graph
  const [showUSRModal, setShowUSRModal] = useState(false); // zoom USR
  const [ingredientsSearch, setIngredientsSearch] = useState("");
  const [showToolForm, setShowToolForm] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  // TEMPORAL SEMANTIC STATE
  const [showTemporalSemanticPopup, setShowTemporalSemanticPopup] = useState(false);
  const [pendingTemporal, setPendingTemporal] = useState(null);
  const [showTemporalForm, setShowTemporalForm] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(true);

  // Connection Prompt State (for and/or between ingredients)
  const [showConnectionPrompt, setShowConnectionPrompt] = useState(false);
  const [pendingIngredientForConnection, setPendingIngredientForConnection] = useState(null);
  const [showAddNewPopup, setShowAddNewPopup] = useState(false);
  const [showOtherNounForm, setShowOtherNounForm] = useState(false);
  const [showGuidedVoice, setShowGuidedVoice] = useState(false);

  // 🧰 Tools / Objects
  const [tools, setTools] = useState([]);
  // 🕒 Temporal Context
  const [temporalContext, setTemporalContext] = useState({
    dayConditions: [
      "today", "yesterday", "tomorrow", "day after tomorrow",
      "day before yesterday", "weekdays", "weekend",
      "Monday", "Tuesday", "Wednesday", "Thursday",
      "Friday", "Saturday", "Sunday",
      "morning", "afternoon", "evening", "night",
      "midnight", "noon"
    ],
    timeConditions: [
      "now", "later", "earlier", "before", "after",
      "immediately", "eventually", "soon", "always",
      "sometimes", "often", "never", "rarely", "frequently"
    ],
    durationConditions: [
      "X minutes", "X hours",
      "golden", "brown", "cooked",
      "boiling", "overnight", "long time", "short time"
    ]
  });

  const [showDay, setShowDay] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showDuration, setShowDuration] = useState(false);

  const [showTemporalContext, setShowTemporalContext] = useState(true);
  const [showDayConditions, setShowDayConditions] = useState(false);
  const [showTimeConditions, setShowTimeConditions] = useState(false);
  const [showDurationConditions, setShowDurationConditions] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showIngredients, setShowIngredients] = useState(true);
  const [showOtherIngredients, setShowOtherIngredients] = useState(true);
  const [showDescriptors, setShowDescriptors] = useState(true);
  const [showRelations, setShowRelations] = useState(true);

  // Map recipe types to ingredient keywords (adjustable)
  const TYPE_KEYWORDS = {
    breakfast: ["egg", "milk", "bread", "butter", "cheese", "oat", "cereal", "yogurt"],
    lunch: ["rice", "dal", "curry", "oil", "garlic", "salt", "spice", "pepper"],
    dinner: ["rice", "dal", "curry", "oil", "garlic", "salt", "pepper", "meat", "fish"],
    dessert: ["sugar", "milk", "cream", "butter", "choc", "honey", "syrup"]
  };

  // Update filtered ingredients when palette or category filter changes
  useEffect(() => {
    // If search is active, search ALL loaded ingredients
    if (ingredientPaletteSearch.trim().length > 0) {
      const filtered = ingredients.filter((ing) =>
        ing.name.toLowerCase().includes(ingredientPaletteSearch.toLowerCase())
      );
      setFilteredIngredients(filtered);
    } else {
      // Normalize names for comparison
      const selectedNamesLower = suggestedIngredients.map(s => {
        const normalized = s.trim().toLowerCase();
        return [normalized, normalized.replace(/\s+/g, "-")];
      }).flat();

      const filtered = ingredients.filter((ing) => {
        const ingNameLower = ing.name.toLowerCase();
        const ingNameHyphenated = ing.name.toLowerCase().replace(/\s+/g, "-");
        return selectedNamesLower.includes(ingNameLower) || selectedNamesLower.includes(ingNameHyphenated);
      });
      setFilteredIngredients(filtered);
    }
  }, [ingredients, suggestedIngredients, ingredientPaletteSearch]);



  const relationWords = [
    "What(subject)",
    "What(object)",
    "Whom",
    "Which",
    "Modifier",
    "When",
    "How",
    "in order to",
    "How long",
    "With what",
    "From where",
    "To where",
    "Why(reason)",
    "which",
    "whose",
  ];

  const semanticOptions = [
    "-",
    "dow",
    "moy",
    "yoc",
    "dom",
    "AD",
    "BC",
    "clocktime",
    "season",
    "timex",
    "numex",
    "anim",
    "male",
    "female",
  ];

  const morphoOptions = [
    "-",
    "pl",
    "mawupa",
    "kqw",
    "xviwva",
    "causative",
    "doublecausative",
    "superl",
    "comparmore",
    "comparless",
  ];

  const tams = [
    "imperative",
    "simple_present",
    "is_am_are",
    "have_has_past_participle",
    "have_has_been_verb_ing",
    "keep_on_verb_ing",
    "simple_past",
    "was_were",
    "was_were_verb_ing",
    "had_past_participle",
    "had_been_verb_ing",
    "kept_on_verb_ing",
    "used_to",
    "will",
    "will_be_verb_ing",
    "might_have_been_verb_ing",
    "might_be_verb_ing",
    "must_be_verb_ing",
    "might_have_past_participle",
    "must",
    "was_supposed_to",
    "shall",
    "ought_to",
    "have_to",
    "had_to",
    "had_to_variant",
    "will_have_to",
    "must_have_had_to",
    "should",
    "can",
    "could",
    "could_variant",
    "custom_TAM_o_1",
    "custom_TAM_o_2",
    "custom_TAM_e_1",
  ];
  // ===== Action Temporal Modifiers (Only for actions) =====
  const actionTemporalModifiers = [
    "for X minutes",
    "for X hours",
    "for a few seconds",
    "for a while",
    "golden",
    "brown",
    "cooked",
    "soft",
    "aromatic",
    "fragrant",
    "boiling",
    "smooth",
    "before",
    "after",
    "immediately",
    "once",
    "when",
    "while",
    "later",
    "then",
    "as soon as",
    "in the morning",
    "in the evening",
    "at night",
    "sometimes",
    "always",
    "often",
    "rarely"
  ];




  // ==== INIT ====
  useEffect(() => {
    const init = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        navigate("/login");
        return;
      }

      const recipeId = localStorage.getItem("currentRecipeId");
      if (!recipeId) {
        // alert("No recipe selected. Please create one first."); // Removed alert to prevent annoying popups on accidental navigation
        navigate("/page1");
        return;
      }

      let initialIngredients = [];

      try {
        const res = await fetch(`${API_URL}/get-recipe/${recipeId}`);
        const data = await res.json();
        if (res.ok) {
          setRecipeName(data.recipe_name || "Unnamed Recipe");
          setRecipeType(data.recipe_type || "N/A");
          setRecipeDuration(data.cooking_time || data.cooking_duration || "N/A");
          setCategoryFilter(data.recipe_type || "all");

          const sIngs = data.ingredients || [];
          initialIngredients = sIngs;
          setSuggestedIngredients(sIngs);

          // Ensure these ingredients exist in the main ingredients list
          // even if they aren't in the global "default" or "custom" collections
          setIngredients(prev => {
            const newPrev = [...prev];
            sIngs.forEach(name => {
              if (!newPrev.some(ing => ing.name.toLowerCase() === name.toLowerCase())) {
                newPrev.push({
                  name,
                  displayName: name,
                  emoji: "🥗",
                  isCustom: false
                });
              }
            });
            return newPrev;
          });
        } else {
          console.error("Failed to fetch recipe info:", data.error || data);
        }
      } catch (err) {
        console.error("Error fetching recipe info:", err);
      }

      await loadAllItems("ingredient", normLang, initialIngredients);

      await loadAllItems("action", normLang);
      await loadAllItems("descriptor", normLang);
      await loadAllItems("tool", normLang);

      await loadPastSentences(recipeId);

      // 🍯 Load draft if it exists for this recipe
      const draftKey = `draft_instruction_${recipeId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCurrentInstruction(parsed);
          }
        } catch (err) {
          console.error("Failed to parse draft instruction:", err);
        }
      }
      setIsDraftLoading(false);
      await loadUserRecipes();
    };

    init();
  }, [navigate, normLang]);

  const loadUserRecipes = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/get-user-recipes/${userId}`);
      const data = await res.json();
      if (res.ok || Array.isArray(data)) {
        setUserRecipes(data.filter(r => r.recipe_id !== localStorage.getItem("currentRecipeId")));
      }
    } catch (err) {
      console.error("Error loading user recipes:", err);
    }
  };

  // 💾 Auto-save draft whenever instruction changes
  useEffect(() => {
    if (isDraftLoading) return;

    const recipeId = localStorage.getItem("currentRecipeId");
    if (!recipeId) return;

    const draftKey = `draft_instruction_${recipeId}`;
    if (currentInstruction.length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(currentInstruction));
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [currentInstruction, isDraftLoading]);

  // 🥄 Ensure all suggested ingredients (from Page 1) are in the palette
  useEffect(() => {
    if (suggestedIngredients.length === 0) return;

    setIngredients(prev => {
      const merged = [...prev];
      const mergedNames = new Set(merged.map(m => m.name.toLowerCase()));

      let changed = false;
      suggestedIngredients.forEach(sName => {
        if (!mergedNames.has(sName.toLowerCase())) {
          merged.push({
            name: sName,
            displayName: sName,
            emoji: "🥗",
            isCustom: true
          });
          mergedNames.add(sName.toLowerCase());
          changed = true;
        }
      });

      return changed ? merged : prev;
    });
  }, [suggestedIngredients]);

  // Load & translate palette items
  const loadAllItems = async (type, language, extraSuggestions = []) => {
    const targetLang = language === "hi" ? "hi" : "en";
    const apiType = type === "tool" ? "other" : type;

    try {
      const response = await fetch(
        `${API_URL}/get-all-items?type=${apiType}`
      );
      const data = await response.json();
      const allItems = [...data.default, ...data.custom];

      // keep original English name, add displayName for UI
      let uiItems = allItems.map((item) => {
        const isCustomItem = data.custom.some(c => c.name === item.name);
        return {
          ...item,
          displayName: item.name,
          isCustom: isCustomItem
        };
      });

      if (targetLang !== "en") {
        uiItems = await Promise.all(
          uiItems.map(async (item) => ({
            ...item,
            displayName: await translateText(item.name, targetLang, "en"),
          }))
        );
      }

      switch (type) {
        case "ingredient":
          setIngredients((prev) => {
            const newItems = uiItems.filter((i) => !i.isOther);

            // 🔥 RESILIENT MERGE:
            // Use explicitly passed suggestions if available (fixes init race condition), 
            // otherwise use state (for subsequent updates)
            const suggestionsToUse = extraSuggestions.length > 0 ? extraSuggestions : suggestedIngredients;

            const merged = [...newItems];
            const mergedNames = new Set(merged.map(m => m.name.toLowerCase()));

            suggestionsToUse.forEach(sName => {
              // Normalize names: replace hyphens with spaces for display if needed, or keep consistent
              // We compare lowercased for uniqueness
              if (!mergedNames.has(sName.toLowerCase())) {
                merged.push({
                  name: sName,
                  displayName: sName, // You might want to translate this too if possible, but safe fallback is name
                  emoji: "🥗",
                  isCustom: true
                });
                mergedNames.add(sName.toLowerCase());
              }
            });

            return merged;
          });
          setOtherIngredients(uiItems.filter((i) => i.isOther));
          break;
        case "action":
          setActions(uiItems);
          break;
        case "descriptor":
          setDescriptors(uiItems);
          break;
        case "tool":
          setTools(uiItems);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Error loading ${type}s:`, err);
    }
  };

  // 🔹 Load steps from DB and translate before display if needed
  // 🔹 Load steps from DB (NO translation)
  const loadPastSentences = async (recipeIdFromParam) => {
    const recipeId =
      recipeIdFromParam || localStorage.getItem("currentRecipeId");
    if (!recipeId) return;

    try {
      const response = await fetch(
        `${API_URL}/get-sentences-with-id/${recipeId}`
      );
      const data = await response.json();

      const instructionsList = Array.isArray(data.instructions)
        ? data.instructions
        : [];

      // Optionally translate if UI language isn't English
      const listWithText = await Promise.all(
        instructionsList.map(async (i) => {
          const text = i.text || i.instruction_text || "";

          // 🔹 Smart Translation:
          // 1. If instruction has a language field, only translate if it doesn't match normLang
          // 2. Otherwise fall back to the old logic (translate if not English)
          let translated = text;
          const instLang = i.language || "english";
          const currentUiLang = normLang === "hi" ? "hindi" : "english";

          if (instLang !== currentUiLang) {
            console.debug(`Translating instruction from ${instLang} to ${currentUiLang}`);
            translated = await translateText(text, normLang, instLang === "hindi" ? "hi" : "en");
          } else {
            console.debug(`Skipping translation for instruction (already ${currentUiLang})`);
          }

          return {
            sentence_id: i.sentence_id || i.sentenceId || null,
            text: translated,
            raw_text: text,
            step_number: i.step_number || null,
            usr_id: i.usr_id || null,
            graph_id: i.graph_id || null,
            instruction_payload: i.instruction_payload || [],
            language: i.language
          };
        })
      );

      setPastInstructions(listWithText);
      setGeneratedInstructions(listWithText.map((x) => x.text));
    } catch (err) {
      console.error("Failed to load past sentences:", err);
    }
  };

  const handleModifyStep = async (sentenceId) => {
    try {
      const resp = await fetch(`${API_URL}/get-instruction-details/${sentenceId}`);
      const data = await resp.json();
      if (resp.ok && data.instruction_payload && data.instruction_payload.length > 0) {
        setCurrentInstruction(data.instruction_payload);
        setIsModifyMode(true);
        setModifyingSentenceId(sentenceId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("Could not load step for modification. It might have been created before this feature was added.");
      }
    } catch (err) {
      console.error("Error modifying step:", err);
    }
  };

  const toggleItemSelection = (type, value, emoji, isBeVerb = false) => {
    let finalValue = value;
    if (typeof value === "string") {
      finalValue = value.trim().replace(/\s+/g, "-");
    }

    // Basic logic to add item to currentInstruction
    if (type === "action") {
      setPendingAction({ value: finalValue, emoji, isBeVerb });
      setShowTAMSelector(true);
    } else if (type === "temporal") {
      let temporalValue = finalValue;
      // prefixing removed for UI display - will be added in generateInstruction

      // Check if already exists (toggle off)
      const exists = currentInstruction.some(c => c.type === "temporal" && c.value === temporalValue);
      if (exists) {
        if (window.confirm(`${temporalValue} is already in the builder. Do you want to remove it?`)) {
          const idx = currentInstruction.findIndex(c => c.type === "temporal" && c.value === temporalValue);
          if (idx !== -1) removeComponent(idx);
        }
        return;
      }

      // mark placeholder items (containing 'X') as duration templates
      const isTemplate = typeof temporalValue === "string" && (temporalValue.includes("X") || temporalValue.toLowerCase().includes("for"));
      if (isTemplate) {
        setPendingDurationTemplate(temporalValue);
        setShowDurationPopup(true);
      } else {
        const temporalComponent = { value: temporalValue, emoji, type: "temporal" };
        setCurrentInstruction((prev) => {
          if (prev.some((c) => c.type === "temporal" && c.value === temporalValue)) return prev;
          return [...prev, temporalComponent];
        });
        setShowRelationPrompt(true);
      }
    } else if (type === "tool") {
      // Check if already exists (toggle off)
      const exists = currentInstruction.some(c => c.type === "tool" && c.value === finalValue);
      if (exists) {
        if (window.confirm(`${finalValue} is already in the builder. Do you want to remove it?`)) {
          const idx = currentInstruction.findIndex(c => c.type === "tool" && c.value === finalValue);
          if (idx !== -1) removeComponent(idx);
        }
        return;
      }

      const toolComponent = {
        type: "tool",
        value: finalValue,
        emoji,
        relation: null
      };
      setCurrentInstruction((prev) => {
        if (prev.some((c) => c.type === "tool" && c.value === finalValue)) return prev;
        return [...prev, toolComponent];
      });
      setShowRelationPrompt(true);
    } else {
      // Check if already exists (prompt to remove)
      const exists = currentInstruction.some(c => c.type === type && c.value === finalValue);
      if (exists) {
        if (window.confirm(`${finalValue} is already in the builder. Do you want to remove it?`)) {
          const idx = currentInstruction.findIndex(c => c.type === type && c.value === finalValue);
          if (idx !== -1) {
            removeComponent(idx);
          }
        }
        return;
      }

      const component = { type, value: finalValue, emoji };
      if (type === "ingredient") {
        // 🔥 CHANGED: Always ask for connection if there is ANY previous ingredient
        // This supports the flow: [Ing1] [Rel] -> Add Ing2 -> Prompt "AND/OR" -> [Ing1] [Rel] [AND] [Ing2] [Rel]
        const hasExistingIngredient = currentInstruction.some(c => c.type === "ingredient");

        if (hasExistingIngredient) {
          setPendingIngredientForConnection(component);
          setShowConnectionPrompt(true);
        } else {
          setPendingIngredient(component);
          setShowSemanticPopup(true);
        }
      } else if (type === "descriptor") {
        // Check if we have a "be" verb - if so, use k1s relation instead of asking
        const hasBeVerb = currentInstruction.some(c => c.type === "action_tam" && c.isBeVerb);
        if (hasBeVerb) {
          // Automatically assign k1s relation for "be" + descriptor
          const descriptorWithRelation = {
            ...component,
            relation: "k1s", // k1s relation
            autoRelation: "k1s"
          };
          setCurrentInstruction((prev) => {
            if (prev.some((c) => c.type === component.type && c.value === component.value)) return prev;
            return [...prev, descriptorWithRelation];
          });
        } else {
          setCurrentInstruction((prev) => {
            if (prev.some((c) => c.type === "descriptor" && c.value === component.value)) return prev;
            return [...prev, component];
          });
          setShowRelationPrompt(true);
        }
      } else {
        setCurrentInstruction((prev) => {
          if (prev.some((c) => c.type === component.type && c.value === component.value)) return prev;
          return [...prev, component];
        });
      }
    }
  };


  // ==== DRAG / DROP ====
  const handleDragStart = (e, type, value, emoji) => {
    let finalValue = value;
    if (typeof value === "string") {
      // 🔗 AUTO-HYPHENATE compound words (e.g., "black pepper" -> "black-pepper")
      finalValue = value.trim().replace(/\s+/g, "-");
    }

    const payload = { type, value: finalValue, emoji };
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
  };


  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    addComponent(data);
  };

  const addComponent = (data) => {
    const type = data.type;
    const lastComponent = currentInstruction[currentInstruction.length - 1];

    const needsRelation =
      lastComponent &&
      lastComponent.type === "ingredient" &&
      !hasRelationAfterLastIngredient();

    if (needsRelation && type !== "relation") {
      alert(
        "Please add a relation for the previous ingredient before adding anything else."
      );
      return;
    }
    // 🔧 TOOLS — only ask relation, nothing else
    if (type === "tool") {
      const toolComponent = {
        ...data,
        type: "tool",
        relation: null   // will be set using relation popup
      };

      setCurrentInstruction((prev) => [...prev, toolComponent]);

      // Immediately open relation popup
      setShowRelationPrompt(true);

      return;
    }

    if (type === "ingredient") {
      // 🔥 CHANGED: Always ask for connection if there is ANY previous ingredient
      const hasExistingIngredient = currentInstruction.some(c => c.type === "ingredient");

      const ingredientComponent = {
        ...data,
        quantity: "",
        measurement: "",
      };

      if (hasExistingIngredient) {
        setPendingIngredientForConnection(ingredientComponent);
        setShowConnectionPrompt(true);
      } else {
        setPendingIngredient(ingredientComponent);
        setShowSemanticPopup(true);
      }
      return;
    }

    if (type === "action") {
      setPendingAction(data);
      setShowTAMSelector(true);
      return;
    }
    if (type === "temporal") {
      let val = data.value;

      // duration objects (ex: {isDuration: true})
      if (val && typeof val === "string" && (val.includes("X") || val.toLowerCase().includes("for"))) {
        setPendingDurationTemplate(val);
        setShowDurationPopup(true);
        return;
      }

      // normal temporal (today, later, etc.)
      const temporalComponent = { ...data, value: val, type: "temporal" };
      setCurrentInstruction((prev) => [...prev, temporalComponent]);
      setShowRelationPrompt(true);
      return;
    }

    let itemValue = data.value;
    const finalData = { ...data, value: itemValue };
    setCurrentInstruction((prev) => [...prev, finalData]);
    if (type === "ingredient" || type === "descriptor") {
      setTimeout(() => setShowRelationPrompt(true), 100);
    }
  };

  const hasRelationAfterLastIngredient = () => {
    const lastIngredientIndex = getLastIngredientIndex();
    if (lastIngredientIndex === -1) return true;
    return currentInstruction
      .slice(lastIngredientIndex + 1)
      .some((c) => c.type === "relation");
  };

  const getLastIngredientIndex = () => {
    for (let i = currentInstruction.length - 1; i >= 0; i--) {
      if (currentInstruction[i].type === "ingredient") return i;
    }
    return -1;
  };

  const hasRelationAfterIndex = (index) =>
    currentInstruction.slice(index + 1).some((c) => c.type === "relation");

  // ==== POPUP CONFIRMS ====
  const confirmSemanticCategory = async (semantic, morpho) => {
    if (!pendingIngredient) return;

    const data = {
      ...pendingIngredient,
      semanticCategory: semantic,
      morphoSemantic: morpho,
    };

    const storedSemantics = JSON.parse(
      localStorage.getItem("semanticData") || "{}"
    );
    storedSemantics[data.value.toLowerCase()] = { semantic, morpho };
    localStorage.setItem("semanticData", JSON.stringify(storedSemantics));

    // persist if new ingredient
    if (data.type === "ingredient") {
      const recipeId = localStorage.getItem("currentRecipeId");
      if (recipeId && !suggestedIngredients.some(s => s.toLowerCase() === data.value.toLowerCase())) {
        const newList = [...suggestedIngredients, data.value];
        try {
          await fetch(`${API_URL}/save-selection`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipe_id: recipeId, ingredients: newList })
          });
          setSuggestedIngredients(newList);
        } catch (err) {
          console.error("Failed to sync new ingredient to recipe:", err);
        }
      }
    }

    setCurrentInstruction((prev) => [...prev, data]);
    setShowSemanticPopup(false);
    setPendingIngredient(null);

    if (inherentRelation) {
      const relComp = { type: "relation", value: inherentRelation, emoji: "🔗" };
      setCurrentInstruction(prev => [...prev, relComp]);
      setInherentRelation(null);
    } else {
      setTimeout(() => setShowRelationPrompt(true), 100);
    }
  };

  const skipSemanticCategory = () => {
    if (!pendingIngredient) return;
    setCurrentInstruction((prev) => [...prev, pendingIngredient]);
    setShowSemanticPopup(false);
    setPendingIngredient(null);

    if (inherentRelation) {
      const relComp = { type: "relation", value: inherentRelation, emoji: "🔗" };
      setCurrentInstruction(prev => [...prev, relComp]);
      setInherentRelation(null);
    } else {
      setTimeout(() => setShowRelationPrompt(true), 100);
    }
  };

  const confirmTemporalSemanticCategory = (semantic, morpho) => {
    if (!pendingTemporal) return;

    const data = {
      ...pendingTemporal,
      semanticCategory: semantic,
      morphoSemantic: morpho,
    };

    setCurrentInstruction((prev) => [...prev, data]);
    setShowTemporalSemanticPopup(false);
    setPendingTemporal(null);
  };

  const skipTemporalSemanticCategory = () => {
    if (!pendingTemporal) return;
    setCurrentInstruction((prev) => [...prev, pendingTemporal]);
    setShowTemporalSemanticPopup(false);
    setPendingTemporal(null);
  };

  const confirmTAM = (tam) => {
    if (!pendingAction) return;

    const actionComponent = {
      type: "action_tam",
      value: `${pendingAction.value}-${tam}`,
      actionName: pendingAction.value,
      tam: tam,
      emoji: `${pendingAction.emoji}⏱️`,
      temporalModifier: null, // no temporal modifier
      isBeVerb: pendingAction.isBeVerb || false, // preserve isBeVerb flag
    };

    // ✅ DIRECTLY add the action to the builder
    setCurrentInstruction((prev) => [...prev, actionComponent]);

    // close TAM popup
    setShowTAMSelector(false);

    // cleanup
    setPendingAction(null);
    setPendingActionComponent(null);
    setSelectedActionTemporalModifier("");
  };




  const confirmRelation = (relation, timeData = null) => {
    setCurrentInstruction((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];

      // ⭐ CASE 1: The last item is a TOOL → attach relation directly
      if (last && last.type === "tool") {
        last.relation = relation;   // Attach selected relation
        return updated;             // Do NOT create a new relation entry
      }

      // ⭐ CASE 2: Normal relation (for ingredients, etc.)
      const relationComponent = {
        type: "relation",
        value: relation,
        emoji: "🔗",
      };

      if (timeData && timeData.start && timeData.end) {
        relationComponent.span = timeData;
      }

      updated.push(relationComponent);
      return updated;
    });

    setShowRelationPrompt(false);
  };


  // ==== BUILDER ACTIONS ====
  const removeComponent = (index) => {
    setCurrentInstruction((prev) => prev.filter((_, i) => i !== index));
  };

  const clearInstruction = () => {
    setCurrentInstruction([]);
  };

  const updateIngredientQuantity = (index, value) => {
    setCurrentInstruction((prev) =>
      prev.map((comp, i) => (i === index ? { ...comp, quantity: value } : comp))
    );
  };

  const updateIngredientMeasurement = (index, value) => {
    setCurrentInstruction((prev) =>
      prev.map((comp, i) =>
        i === index ? { ...comp, measurement: value } : comp
      )
    );
  };

  const handleAddNewInstruction = async () => {
    const recipeId = localStorage.getItem("currentRecipeId");
    if (!recipeId) {
      alert("No recipe selected. Please create one first.");
      navigate("/page1");
      return;
    }

    setCurrentInstruction([]);
    setGraphImage("");
    setUsrTableHtml("");
    setEnglishSentences([]);
    setLastSpokenText(""); // Clear voice transcript
    setShowRelationPrompt(false);
    setPendingIngredient(null);
    setPendingAction(null);

    try {
      await fetch(`${API_URL}/reset-graph`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId }),
      });
    } catch (err) {
      console.error("reset-graph failed:", err);
    }
  };

  const generateInstruction = async () => {
    const allActions = currentInstruction.filter((c) => c.type === "action_tam");
    if (allActions.length === 0) {
      alert("You must include at least one action with TAM.");
      return;
    }

    const stateDurations = ["golden", "gold", "golde", "brown", "cooked", "boiling", "soft", "soften", "aromatic", "fragrant", "smooth"];

    const primaryAction = allActions[0];
    const toolsWithoutRelation = currentInstruction.filter(
      (c) => c.type === "tool" && !c.relation
    );

    if (toolsWithoutRelation.length > 0) {
      alert("Please select a relation for all tools.");
      return;
    }

    const recipeId = localStorage.getItem("currentRecipeId");
    if (!recipeId) {
      alert("No recipe selected. Please create one first.");
      return;
    }

    // 🔍 Are we EDITING an existing step?
    const isEditingCurrentStep =
      !!graphImage || !!usrTableHtml || englishSentences.length > 0;

    if (isEditingCurrentStep && generatedInstructions.length > 0) {
      const lastSentence = generatedInstructions[generatedInstructions.length - 1];
      try {
        await fetch("http://localhost:2000/delete-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipeId, sentence: lastSentence }),
        });
      } catch (err) {
        console.error("Failed to delete previous sentence before regenerate:", err);
      }
    }

    setGraphImage("");
    setUsrTableHtml("");
    setEnglishSentences([]);

    const [verb, tam] = primaryAction.value.split("-");

    let instruction = {
      verb,
      tam,
      nounRelations: [],
      descriptors: [],
      temporals: [],
      tools: [],
      secondaryActions: [],
    };

    // Collect secondary actions
    allActions.slice(1).forEach((action) => {
      const [v, t] = action.value.split("-");
      instruction.secondaryActions.push({
        verb: v,
        tam: t,
        relation: "vmod",
      });
    });

    let currentActionIndex = 0;
    let pendingIngsGroup = [];
    let groupType = "SimpleConcept";
    let activeRelation = null;
    let pendingModifiers = [];

    for (let i = 0; i < currentInstruction.length; i++) {
      const component = currentInstruction[i];

      if (component.type === "action_tam") {
        currentActionIndex = allActions.indexOf(component);
      } else if (component.type === "ingredient") {
        pendingIngsGroup.push(component);
      } else if (component.type === "connection") {
        groupType = component.value === "and" ? "Conjoined" : "Disjoined";
      } else if (component.type === "relation") {
        activeRelation = component;

        // Peak ahead: are there more ingredients connected to this group?
        let j = i + 1;
        let moreInGroup = false;
        while (j < currentInstruction.length) {
          const next = currentInstruction[j];
          if (next.type === "connection") {
            moreInGroup = true;
            break;
          }
          if (next.type === "ingredient") {
            // Hit an ingredient but NO connection? 
            // This means we have: [Ing] [Relation] [Ing]...
            // The second ingredient is a NEW group.
            moreInGroup = false;
            break;
          }
          if (next.type === "action_tam" || next.type === "descriptor" || next.type === "tool" || next.type === "temporal") {
            break;
          }
          j++;
        }

        if (!moreInGroup && pendingIngsGroup.length > 0) {
          // SEAL THE GROUP
          if (pendingIngsGroup.length === 1 && groupType === "SimpleConcept") {
            const ing = pendingIngsGroup[0];
            const nounRelation = {
              relation: activeRelation.value,
              relationType: "SimpleConcept",
              noun: ing.value,
              semanticCategory: ing.semanticCategory || "",
              morphoSemantic: ing.morphoSemantic || "",
              actionIndex: currentActionIndex,
            };

            if (ing.quantity) nounRelation.quantity = ing.quantity;
            if (ing.measurement) nounRelation.measurement = ing.measurement;

            if (activeRelation.span && (activeRelation.span.start || activeRelation.span.end)) {
              const unit = activeRelation.span.unit || "minutes";
              nounRelation.complexType = "span";
              nounRelation.startNoun = activeRelation.span.start || "";
              nounRelation.endNoun = activeRelation.span.end || "";
              nounRelation.startMeasurements = { [activeRelation.span.start || ""]: unit };
              nounRelation.endMeasurements = { [activeRelation.span.end || ""]: unit };
            }
            // Add mod/intf tracks for simple concepts too
            nounRelation.nounModifiers = { [ing.value]: ing.modifiers || [] };
            nounRelation.nounIntensifiers = { [ing.value]: [] };

            instruction.nounRelations.push(nounRelation);
          } else {
            const names = pendingIngsGroup.map((ing) => ing.value);
            const nounRelation = {
              relation: activeRelation.value,
              relationType: groupType === "SimpleConcept" ? "Conjoined" : groupType,
              selectedNouns: names,
              quantities: {},
              measurements: {},
              measureTypes: {},
              nounModifiers: {},
              nounIntensifiers: {},
              semanticCategory: pendingIngsGroup[0].semanticCategory || "",
              morphoSemantic: pendingIngsGroup[0].morphoSemantic || "",
              actionIndex: currentActionIndex,
            };

            pendingIngsGroup.forEach((ing) => {
              const n = ing.value;
              nounRelation.quantities[n] = ing.quantity || "";
              nounRelation.measurements[n] = ing.measurement || "";
              nounRelation.measureTypes[n] = (ing.quantity || ing.measurement) ? "simple" : "none";
              nounRelation.nounModifiers[n] = ing.modifiers || [];
              nounRelation.nounIntensifiers[n] = [];
            });
            instruction.nounRelations.push(nounRelation);
          }
          pendingIngsGroup = [];
          groupType = "SimpleConcept";
          activeRelation = null;
        }
      } else if (component.type === "ingredient") {
        const ing = { ...component };
        if (pendingModifiers.length > 0) {
          ing.modifiers = [...(ing.modifiers || []), ...pendingModifiers];
          pendingModifiers = [];
        }
        pendingIngsGroup.push(ing);
      } else if (component.type === "descriptor") {
        let desc = (component.value || "").toLowerCase().trim();
        let relation = "mod";

        // Use auto-relation if set (e.g. from Be verb logic)
        if (component.autoRelation) {
          relation = component.autoRelation;
        }

        // 🔥 REFINED STICKY DESCRIPTOR LOGIC:
        const prevComp = currentInstruction[i - 1];
        let attachedToNoun = false;

        // Check if explicitly relation was provided via prompt
        const nextComp = currentInstruction[i + 1];
        if (nextComp && nextComp.type === "relation") {
          relation = nextComp.value;
          // Map long UI strings to codes
          if (relation.includes("krvn")) relation = "krvn";
          else if (relation.includes("subject") || relation.includes("k1s")) relation = "k1s";
          else if (relation.includes("how-कैसे")) relation = "how";
          i++; // Consume relation component
        } else {
          // No explicit relation provided - infer context

          // If we have [Descriptor, Action], assume krvn
          // But careful not to consume the action here, just reference it
          if (nextComp && nextComp.type === "action_tam") {
            relation = "krvn";
            // If next is Action, we want to attach this descriptor to *that* action.
            // Currently actionIndex points to *previous* action.
            // We need to resolve this in the final object or just rely on backend handling order.
            // For now, we set relation to krvn.
          }
        }

        const canStick = true;

        if (canStick) {
          const adjLookups = ["small", "large", "big", "tiny", "huge", "medium", "thick", "thin", "heavy", "light", "hot", "cold", "warm", "fresh", "dry", "wet", "clean", "dirty", "old", "new"];
          const isStickable = stateDurations.some(s => desc.startsWith(s)) || adjLookups.some(a => desc.startsWith(a));

          if (isStickable && relation !== "krvn" && relation !== "k1s") {
            // Priority 1: Attach to previous ingredient in current group
            if (pendingIngsGroup.length > 0) {
              const lastIng = pendingIngsGroup[pendingIngsGroup.length - 1];
              lastIng.modifiers = [...(lastIng.modifiers || []), desc];
              attachedToNoun = true;
            }
            // Priority 2: Attach to last completed noun (if it was an ingredient)
            // Removed || prevComp.type === "relation" to prevent stealing descriptors following a relation
            else if (instruction.nounRelations.length > 0 && prevComp && prevComp.type === "ingredient") {
              const lastNounRel = instruction.nounRelations[instruction.nounRelations.length - 1];
              if (lastNounRel && lastNounRel.relationType === "SimpleConcept") {
                const nounKey = lastNounRel.noun;
                if (nounKey) {
                  lastNounRel.nounModifiers[nounKey] = [...(lastNounRel.nounModifiers[nounKey] || []), desc];
                  attachedToNoun = true;
                }
              }
            }
            // Priority 2b: Attach to last completed tool
            else if (instruction.tools.length > 0 && prevComp && prevComp.type === "tool") {
              const lastTool = instruction.tools[instruction.tools.length - 1];
              lastTool.modifiers = [...(lastTool.modifiers || []), desc];
              attachedToNoun = true;
            }

            // Priority 3: Queue for next item (forward-sticking)
            if (!attachedToNoun) {
              pendingModifiers.push(desc);
              attachedToNoun = true;
            }
          }
        }

        if (!attachedToNoun) {
          // Special handling: if relation is krvn and we are effectively modifying the NEXT action
          // We might need to handle actionIndex differently.
          // However, current implementation binds to currentActionIndex (last seen).
          // If the sequence is Desc -> Action, currentActionIndex is previous one.
          // This is a limitation. But typically backend reconstructs flow.
          // We will proceed with assigning relation.

          instruction.descriptors.push({ value: desc, relation: relation, actionIndex: currentActionIndex });
        }
      } else if (component.type === "temporal") {
        let val = component.durationNumber || component.value;
        let lowerVal = String(val).toLowerCase();

        let t_relation = "k7t";
        if (["immediately", "eventually", "as-per-needed"].includes(lowerVal)) t_relation = "krvn";
        else if (["soon", "always", "never", "sometimes", "often", "rarely", "frequently"].includes(lowerVal)) t_relation = "freq";
        else if (component.durationNumber || lowerVal.includes("for-")) t_relation = "dur";

        const t_nextComp = currentInstruction[i + 1];
        if (t_nextComp && t_nextComp.type === "relation") {
          t_relation = t_nextComp.value;
          i++;
        }

        instruction.temporals.push({
          value: val,
          unit: component.durationUnit || "",
          display: component.value,
          relation: t_relation,
          semanticCategory: component.semanticCategory || "",
          morphoSemantic: component.morphoSemantic || "",
          actionIndex: currentActionIndex,
        });
      } else if (component.type === "tool") {
        let tool_relation = component.relation || "k7p";
        const tool_nextComp = currentInstruction[i + 1];
        if (tool_nextComp && tool_nextComp.type === "relation") {
          tool_relation = tool_nextComp.value;
          i++; // Consume relation component
        }

        const toolObj = {
          tool: component.value,
          relation: tool_relation,
          relationType: "Tool",
          actionIndex: currentActionIndex,
          modifiers: [],
        };
        console.log("Processing tool:", component.value, "Pending mods:", pendingModifiers);
        if (pendingModifiers.length > 0) {
          toolObj.modifiers = [...pendingModifiers];
          console.log("Assigned modifiers to tool:", toolObj.modifiers);
          pendingModifiers = [];
        }
        instruction.tools.push(toolObj);
      }
    }

    if (pendingModifiers.length > 0) {
      pendingModifiers.forEach((m) => {
        instruction.descriptors.push({
          value: m,
          relation: "mod",
          actionIndex: currentActionIndex,
        });
      });
      pendingModifiers = [];
    }

    if (pendingIngsGroup.length > 0) {
      alert("Please add a relation after your ingredients.");
      return;
    }

    const verbPart = `${verb} (${tam.replace(/_/g, " ")})`;
    const descriptorPart =
      instruction.descriptors.length > 0
        ? instruction.descriptors
          .map((d) => `(${d.relation}: ${d.value})`)
          .join(" ")
        : "";
    const nounParts = [];
    let currentConnector = null;

    currentInstruction.forEach(c => {
      if (c.type === "ingredient") {
        let text = c.value;
        if (currentConnector) {
          text = `${currentConnector} ${text}`;
          currentConnector = null;
        }
        nounParts.push(text);
      } else if (c.type === "connection") {
        currentConnector = c.value;
      }
    });

    const nounPart = nounParts.join(" ");
    const temporalPart =
      instruction.temporals.length > 0
        ? instruction.temporals
          .map(t => t.display || t.value)
          .join(" ")
        : "";

    const toolPart = instruction.tools.length > 0
      ? instruction.tools
        .map(t => {
          const mods = (t.modifiers && t.modifiers.length > 0) ? t.modifiers.join(" ") + " " : "";
          const toolText = mods + t.tool;
          return t.relation ? `(${t.relation}: ${toolText})` : toolText;
        })
        .join(" ")
      : "";

    const sentence =
      `${verbPart}` +
      `${descriptorPart ? " " + descriptorPart : ""}` +
      `${nounPart ? " " + nounPart : ""}` +
      `${toolPart ? " " + toolPart : ""}` +
      `${temporalPart ? " " + temporalPart : ""}.`;


    // ♻️ 3) Reset graph in BACKEND so new graph doesn't append to old
    try {
      await fetch("http://localhost:2000/reset-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId }),
      });
    } catch (err) {
      console.error("reset-graph failed before generate:", err);
    }

    // 🧠 4) Create fresh graph + USR + external sentences
    await callCreateGraphAPI(recipeId, instruction, sentence);

    // ✍️ 5) Set transcript text for display
    setLastSpokenText(sentence);

    // 🔄 6) Reload steps list — now it will contain the updated sentence
    await loadPastSentences(recipeId);
  };



  // ==== GRAPH + USR + EXTERNAL ====
  const callCreateGraphAPI = async (recipeId, instruction, sentence) => {
    const safeInstruction = {
      ...instruction,
      descriptors: instruction.descriptors || [],
      nounRelations: instruction.nounRelations.map((nr) => ({
        ...nr,
        relation: nr.relation || "k1",
        relationType: nr.relationType || "SimpleConcept",
      })),
      temporals: instruction.temporals || [],   // ← include temporals for backend
    };


    try {
      const response = await fetch("http://localhost:2000/create-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipeId,
          instruction: safeInstruction,
          instruction_list: currentInstruction, // Store original array for editing
          sentence,
          is_modify: isModifyMode,
          modify_sentence_id: modifyingSentenceId
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setGraphImage(normalizeGraphImage(data.graph_image));
        setSelectedSentenceId(data.sentence_id || data.usr_id); // Track current sentence ID for history clicks

        // Reset modify mode after successful generation
        setIsModifyMode(false);
        setModifyingSentenceId(null);

        const rawUsrText = data.usr_text || "";

        // 🔹 Only do light augmentation (no extra quantity/unit nodes)
        const cleanedUsr = augmentUSRText(rawUsrText, safeInstruction.nounRelations);

        const tableHtml = renderUSRTable(cleanedUsr);
        setUsrTableHtml(tableHtml);

        await sendUSRToExternalService(cleanedUsr, data.graph_id, data.usr_id, isModifyMode, modifyingSentenceId);

        // Highlight "Add New Instruction" button
        setShowAddNewPopup(true);
        setTimeout(() => setShowAddNewPopup(false), 5000);

      } else {
        console.error("Graph creation failed:", data.message);
        alert("Graph creation failed: " + data.message);
      }
    } catch (err) {
      console.error("Error creating graph:", err);
      alert("Error creating graph. Check console for details.");
    }
  };

  const downloadText = (filename, text) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadStep = async (inst) => {
    try {
      const res = await fetch(`${API_URL}/get-instruction-details/${inst.sentence_id}`);
      const data = await res.json();
      if (res.ok) {
        const content = `Sentence: ${inst.text}\n\nUSR Table:\n${data.usr_text}\n`;
        downloadText(`sentence_${inst.sentence_id}.txt`, content);
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleDownloadAll = async () => {
    let allContent = "";

    // Past instructions
    for (let i = 0; i < pastInstructions.length; i++) {
      const inst = pastInstructions[i];
      try {
        const res = await fetch(`${API_URL}/get-instruction-details/${inst.sentence_id}`);
        const data = await res.json();
        if (res.ok) {
          allContent += `Sentence: ${inst.text}\n\nUSR Table:\n${data.usr_text}\n\n${"=".repeat(50)}\n\n`;
        }
      } catch (err) { }
    }

    // Current if any
    if (englishSentences.length > 0 && selectedSentenceId) {
      try {
        const res = await fetch(`${API_URL}/get-instruction-details/${selectedSentenceId}`);
        const data = await res.json();
        if (res.ok) {
          allContent += `Sentence: ${englishSentences[0]}\n\nUSR Table:\n${data.usr_text}\n\n${"=".repeat(50)}\n\n`;
        }
      } catch (err) { }
    }

    if (!allContent) return alert("Nothing to download yet.");
    downloadText("all_sentences_usr.txt", allContent);
  };


  const augmentUSRText = (usrText, nounRelations = []) => {
    // Split into lines & ignore comments
    const lines = usrText
      .trim()
      .split("\n")
      .filter(
        (l) =>
          l.trim() !== "" &&
          !l.trim().startsWith("#") &&
          !l.trim().startsWith("%")
      );

    // Collect existing numeric IDs from second column
    const idList = lines
      .map((l) => {
        const parts = l.trim().split(/\s+/);
        return parseInt(parts[1]) || 0;
      })
      .filter((n) => !isNaN(n) && n > 0);

    const maxId = idList.length ? Math.max(...idList) : 0;
    let nextId = maxId + 1;
    const additions = [];

    // 🔴 IMPORTANT CHANGE:
    // We NO LONGER add extra quantity/unit (6:count / 6:unit) nodes here
    // because backend already encodes count & unit (3:count, 3:unit etc).
    // So that whole nounRelations-forEach block has been removed.

    // ─────────────────────────────────────
    // Optional: still add a "named entity" node if semantics say so
    // ─────────────────────────────────────
    const storedSemantics = JSON.parse(
      localStorage.getItem("semanticData") || "{}"
    );

    const presentKeys = Object.keys(storedSemantics).filter((k) =>
      usrText.toLowerCase().includes(k.toLowerCase())
    );

    let namedKey = null;
    for (const k of presentKeys) {
      const sem = (storedSemantics[k].semantic || "").toLowerCase();
      if (sem.includes("named") || sem.includes("person") || sem.includes("proper")) {
        namedKey = k;
        break;
      }
    }

    if (namedKey) {
      const nn = `${namedKey}__${nextId}`;
      const nline = `${nn} ${nextId} - - - - 7:begin`;
      additions.push(nline);
      nextId++;
    }

    if (additions.length === 0) return usrText;
    return usrText.trim() + "\n" + additions.join("\n");
  };


  const renderUSRTable = (usrText) => {
    if (!usrText) return "";

    const lines = usrText.split("\n");
    const seenConstruction = new Set();

    const headers = [
      "Node",
      "ID",
      "Semantic Category",
      "Morpho-Semantic",
      "Relation",
      "Speaker View",
      "Construction",
    ];

    const storedSemantics = JSON.parse(
      localStorage.getItem("semanticData") || "{}"
    );

    let html = `<table class="usr-table"><thead><tr>`;
    headers.forEach((h) => (html += `<th>${h}</th>`));
    html += `</tr></thead><tbody>`;

    const allowedDeps = [
      "main",
      "k1", "k2", "k3", "k4", "k5", "k7p", "k2p",
      "k7t",        // time / day
      "dur",         // duration
      "timex",
      "mod",
      "krvn",
      "quant",
      "card",
      "count",
      "unit",
      "rmeas",
      "rt", "rh", "ru", "rv",
      "freq", // Added freq
    ];

    const wordMap = {
      when: "k7t",
      today: "k7t",
      yesterday: "k7t",
      tomorrow: "k7t",
      "day-after-tomorrow": "k7t",
      "day-before-yesterday": "k7t",
      weekdays: "k7t",
      weekend: "k7t",
      monday: "k7t",
      tuesday: "k7t",
      wednesday: "k7t",
      thursday: "k7t",
      friday: "k7t",
      saturday: "k7t",
      sunday: "k7t",
      morning: "k7t",
      afternoon: "k7t",
      evening: "k7t",
      night: "k7t",
      midnight: "k7t",
      noon: "k7t",
      now: "k7t",
      later: "k7t",
      earlier: "k7t",
      before: "k7t",
      after: "k7t",

      immediately: "krvn",
      eventually: "krvn",
      "as-per-needed": "krvn",

      soon: "freq",
      always: "freq",
      never: "freq",
      sometimes: "freq",
      often: "freq",
      rarely: "freq",
      frequently: "freq",

      spicy: "mod",
      medium: "mod",
      brown: "mod",
      aromatic: "mod",
      fragrant: "mod",
      golden: "mod",
      smooth: "mod",
      dry: "mod",
      "finely-chopped": "mod",
      small: "mod",
      red: "mod",
      cool: "mod",
      "until-golden": "k7t",
      "until-brown": "k7t",
      "until-cooked": "k7t",
      "until-boiling": "k7t",
      "until-golden-colour": "k7t",
      "until-golden-color": "k7t",
      "for-overnight": "k7t",

      howlong: "dur",
      minutes: "dur",
      hours: "dur",
      where: "k7p",
      fromwhere: "k5",
      towhere: "k2p",
      how: "krvn",
      whatsubject: "k1",
      whatobject: "k2",
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("%")) return;

      const cols = trimmed.split(/\s+/);
      if (cols.length < 2) return;

      const node = cols[0].replace(/^_/, "");
      const id = cols[1];

      /* ---------------- Relation ---------------- */
      let relation = "-";
      let relations = [];

      for (let c of cols) {
        const m = c.match(/^(\d+):(.+)$/);
        if (!m) continue;

        const idx = m[1];
        const raw = m[2].toLowerCase();

        if (raw === "count" || raw === "unit") continue;

        if (allowedDeps.includes(raw) || /^k\d+[a-z]*$/.test(raw)) {
          relations.push(`${idx}:${raw}`);
          continue;
        }

        if (wordMap[raw]) {
          relations.push(`${idx}:${wordMap[raw]}`);
        }
      }

      // ✅ assign to existing variable (NO redeclaration)
      relation = relations.length ? relations.join(", ") : "-";



      /* ---------------- Construction ---------------- */
      let construction = "-";
      for (let c of cols) {
        if (!/^\d+:(count|unit|start|end)$/.test(c)) continue;
        if (seenConstruction.has(c)) continue;

        seenConstruction.add(c);
        construction = c;
        break;
      }

      /* ---------------- Semantics ---------------- */
      const cleanNode = node.toLowerCase().split("__")[0];
      const semData = storedSemantics[cleanNode] || {};

      html += `
      <tr>
        <td>${node}</td>
        <td>${id}</td>
        <td>${semData.semantic || "-"}</td>
        <td>${semData.morpho || "-"}</td>
        <td>${relation}</td>
        <td>-</td>
        <td>${construction}</td>
      </tr>
    `;
    });

    html += `</tbody></table>`;
    return html;
  };



  // Normalize graph image strings (accepts either full data URLs or raw base64)
  const normalizeGraphImage = (g) => {
    if (!g) return "";
    if (typeof g !== "string") return "";
    return g.startsWith("data:") ? g : `data:image/png;base64,${g}`;
  };

  // translate external English sentences to current language
  // 🔹 Send USR + language to backend, but keep returned sentences as-is
  const sendUSRToExternalService = async (usrText, graphId, usrId, isModify = false, sentenceId = null) => {
    setLoading(true);
    const recipeId = localStorage.getItem("currentRecipeId");

    // app language for backend / external model
    const uiLangForAPI = normLang === "hi" ? "hindi" : "english";

    if (!recipeId) {
      setLoading(false);
      alert("No recipe selected. Please create one on Page 1.");
      return;
    }

    const formattedInput = {
      recipe_id: recipeId,
      usr_text: usrText,
      graph_id: graphId,
      usr_id: usrId,
      language: uiLangForAPI,     // 👈 send language
      modify_sentence_id: sentenceId, // 👈 add modification info
      is_modify: isModify
    };

    try {
      const response = await fetch("http://localhost:2000/send-usr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedInput),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.english_sentences) {
        // DO NOT TRANSLATE – keep whatever external API returned
        const sentences = Array.isArray(data.english_sentences)
          ? data.english_sentences
          : [data.english_sentences];

        // 🔁 Replace old sentences with new ones
        setEnglishSentences(sentences);
      } else {
        alert(data.error || "No English sentences returned.");
      }


    } catch (error) {
      setLoading(false);
      console.error("Network error:", error);
      alert("Network error: " + error);
    }
  };


  // ==== SENTENCE REMOVAL ====
  const removeSentence = async (sentence) => {
    const recipeId = localStorage.getItem("currentRecipeId");
    if (!recipeId) {
      alert("No recipe selected.");
      return;
    }

    // NOTE: backend still expects English sentence; delete-by-text will
    // only work properly in English mode. (Same as before.)
    try {
      const response = await fetch("http://localhost:2000/delete-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId, sentence }),
      });

      const data = await response.json();
      alert(data.message || "Sentence removed.");
      setEnglishSentences((prev) => prev.filter((s) => s !== sentence));
    } catch (err) {
      console.error(err);
      alert("Error removing sentence.");
    }
  };

  const removeGeneratedStep = async (index) => {
    const recipeId = localStorage.getItem("currentRecipeId");
    if (!recipeId) {
      alert("No recipe selected.");
      return;
    }

    // Use the pastInstructions entry to determine exact sentence text to delete
    const inst = pastInstructions[index];
    const sentence = inst ? inst.text : generatedInstructions[index];
    if (!sentence) return;

    try {
      const response = await fetch("http://localhost:2000/delete-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId, sentence }),
      });

      const data = await response.json();
      alert(data.message || "Step removed.");
      await loadPastSentences(recipeId);
    } catch (err) {
      console.error("Error removing step:", err);
      alert("Error removing step.");
    }
  };

  // ==== ITEM CRUD ====
  /* ==== ITEM CRUD ==== */
  const addNewIngredient = async (name, emoji) => {
    try {
      const uiLang = normLang || "en";
      let englishName = name.trim().replace(/\s+/g, "-");

      if (uiLang === "hi") {
        englishName = await translateText(name, "en", "hi");
        englishName = englishName.trim().replace(/\s+/g, "-");
      }

      // 1. Check if already exists in loaded ingredients
      const existing = ingredients.find((it) => it.name.toLowerCase() === englishName.toLowerCase());

      if (existing) {
        // Check if it is currently visible (in suggestedIngredients)
        // Normalize suggested names for comparison
        const isSelected = suggestedIngredients.some(s => s.toLowerCase() === englishName.toLowerCase());

        if (isSelected) {
          setShowIngredientForm(false);
          alert("This ingredient is already present and visible in your palette.");
          return;
        } else {
          // It exists but is hidden -> Add to suggestions
          const newList = [...suggestedIngredients, englishName];
          setSuggestedIngredients(newList);

          // Persist selection
          const recipeId = localStorage.getItem("currentRecipeId");
          if (recipeId) {
            fetch(`${API_URL}/save-selection`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ recipe_id: recipeId, ingredients: newList })
            }).catch(err => console.error("Error saving selection:", err));
          }

          setShowIngredientForm(false);
          showToast(`Added ${englishName} to your palette.`);
          return;
        }
      }

      // 2. If not exists, create new custom item via API
      const response = await fetch(`${API_URL}/add-custom-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ingredient",
          name: englishName,
          emoji,
          original: name,
          lang: uiLang,
        }),
      });

      const data = await response.json();
      if (response.ok && data.message) {
        // Add new ingredient directly to local state
        const newItem = {
          name: englishName,
          emoji,
          displayName: uiLang === "en" ? englishName : name,
          isCustom: true,
        };

        if (uiLang === "en" || uiLang === "hi") {
          setIngredients((prev) => [...prev, newItem]);
          setSuggestedIngredients((prev) => [...prev, englishName]);
        }

        setShowIngredientForm(false);
        showToast("Ingredient added successfully");
      } else {
        console.error("add-custom-item failed:", data);
        alert("Failed to add ingredient: " + (data.error || (data.message || "Unknown error")));
      }
    } catch (err) {
      console.error("Error adding ingredient:", err);
      alert("Error adding ingredient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addNewAction = async (name, emoji) => {
    try {
      const uiLang = normLang || "en";
      let englishName = name.trim().replace(/\s+/g, "-");

      if (uiLang === "hi") {
        englishName = await translateText(name, "en", "hi");
        englishName = englishName.trim().replace(/\s+/g, "-");
      }

      const response = await fetch(`${API_URL}/add-custom-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "action",
          name: englishName,
          emoji,
          original: name,
          lang: uiLang,
        }),
      });

      const data = await response.json();
      if (data.message) {
        if (actions.some((a) => a.name.toLowerCase() === englishName.toLowerCase())) {
          setShowActionForm(false);
          alert("This action is already present in existing ones");
          return;
        }
        setActions((prev) => [
          ...prev,
          {
            name: englishName,
            emoji,
            displayName: uiLang === "en" ? englishName : name,
          },
        ]);
        setShowActionForm(false);
        showToast("Action added successfully");
      } else {
        alert("Failed to add action: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding action:", err);
      alert("Error adding action. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addNewDescriptor = async (name, emoji) => {
    try {
      const uiLang = normLang || "en";
      let englishName = name.trim().replace(/\s+/g, "-");

      if (uiLang === "hi") {
        englishName = await translateText(name, "en", "hi");
        englishName = englishName.trim().replace(/\s+/g, "-");
      }

      const response = await fetch(`${API_URL}/add-custom-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "descriptor",
          name: englishName,
          emoji,
          original: name,
          lang: uiLang,
        }),
      });

      const data = await response.json();
      if (data.message) {
        if (descriptors.some((d) => d.name.toLowerCase() === englishName.toLowerCase())) {
          setShowDescriptorForm(false);
          alert("This descriptor is already present in existing ones");
          return;
        }
        setDescriptors((prev) => [
          ...prev,
          {
            name: englishName,
            emoji,
            displayName: uiLang === "en" ? englishName : name,
          },
        ]);
        setShowDescriptorForm(false);
        showToast("Descriptor added successfully");
      } else {
        alert("Failed to add descriptor: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding descriptor:", err);
      alert("Error adding descriptor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addNewTool = async (name, emoji) => {
    try {
      const uiLang = normLang || "en";
      let englishName = name.trim().replace(/\s+/g, "-");

      if (uiLang === "hi") {
        englishName = await translateText(name, "en", "hi");
        englishName = englishName.trim().replace(/\s+/g, "-");
      }

      const response = await fetch(`${API_URL}/add-custom-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "other",
          name: englishName,
          emoji,
          original: name,
          lang: uiLang,
        }),
      });

      const data = await response.json();
      if (data.message) {
        if (tools.some((t) => t.name.toLowerCase() === englishName.toLowerCase())) {
          setShowToolForm(false);
          alert("This tool is already present in existing ones");
          return;
        }
        setTools((prev) => [
          ...prev,
          {
            name: englishName,
            emoji,
            displayName: uiLang === "en" ? englishName : name,
          },
        ]);
        setShowToolForm(false);
        showToast("Tool added successfully");
      } else {
        alert("Failed to add tool: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding tool:", err);
      alert("Error adding tool. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addNewTemporal = (name, emoji) => {
    setTemporalContext((prev) => ({
      ...prev,
      timeConditions: [...prev.timeConditions, name],
    }));
    setShowTemporalForm(false);
    showToast("Temporal item added successfully");
  };

  const addNewOtherNoun = async (name, emoji) => {
    try {
      const uiLang = normLang || "en";
      let englishName = name.trim().replace(/\s+/g, "-");

      if (uiLang === "hi") {
        englishName = await translateText(name, "en", "hi");
        englishName = englishName.trim().replace(/\s+/g, "-");
      }

      const response = await fetch(`${API_URL}/add-custom-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "other",
          name: englishName,
          emoji,
          original: name,
          lang: uiLang,
        }),
      });

      const data = await response.json();
      if (data.message) {
        if (otherIngredients.some((i) => i.name.toLowerCase() === englishName.toLowerCase())) {
          setShowOtherNounForm(false);
          alert("This item is already present");
          return;
        }
        setOtherIngredients((prev) => [
          ...prev,
          {
            name: englishName,
            emoji,
            displayName: uiLang === "en" ? englishName : name,
          },
        ]);
        setShowOtherNounForm(false);
        showToast("Noun added successfully");
      } else {
        alert("Failed to add noun: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding noun:", err);
      alert("Error adding noun. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePastSentenceClick = async (sentenceId) => {
    if (!sentenceId) return;
    setLastSpokenText(""); // Clear any current voice transcript
    setGraphImage("");      // Clear current graph
    setUsrTableHtml("");    // Clear current USR
    setEnglishSentences([]); // Clear current sentences
    console.debug("Fetching details for sentenceId:", sentenceId);
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/get-instruction-details/${sentenceId}`);
      const data = await res.json();
      if (res.ok) {
        console.debug("Received Instruction details:", data);
        setUsrTableHtml(renderUSRTable(data.usr_text));

        let foundGraph = "";

        // Prefer direct graph_image; if backend returns empty but provides a graph_id, fetch it
        if (data.graph_image) {
          console.debug("Found graph_image in /get-instruction-details (len=" + data.graph_image.length + ")");
          foundGraph = normalizeGraphImage(data.graph_image);
        } else if (data.graph_id) {
          console.debug("No graph_image on instruction — fetching /get-graph by graph_id:", data.graph_id);
          try {
            const gRes = await fetch(`${API_URL}/get-graph/${data.graph_id}`);
            const gData = await gRes.json();
            if (gRes.ok && gData.graph_image) {
              console.debug("Found graph via /get-graph");
              foundGraph = normalizeGraphImage(gData.graph_image);
            }
          } catch (gErr) {
            console.error("Error fetching graph by id:", gErr);
          }
        }

        if (!foundGraph && data.usr_id) {
          // Final fallback: try fetching graph via the USR record
          console.debug("Still no graph — trying /get-graph-by-usr/", data.usr_id);
          try {
            const gRes = await fetch(`${API_URL}/get-graph-by-usr/${data.usr_id}`);
            const gData = await gRes.json();
            if (gRes.ok && gData.graph_image) {
              console.debug("Found graph via /get-graph-by-usr");
              foundGraph = normalizeGraphImage(gData.graph_image);
            }
          } catch (gErr) {
            console.error("Error fetching graph by usr id:", gErr);
          }
        }

        console.debug("Final graphImage state will be:", foundGraph ? "(image data)" : "(empty)");
        setGraphImage(foundGraph);
        setEnglishSentences([data.instruction_text]);
      } else {
        alert("Failed to load details: " + data.error);
        setGraphImage("");
      }
    } catch (err) {
      console.error("Error loading past instruction details:", err);
      setGraphImage("");
    } finally {
      setLoading(false);
    }
  };


  const removeItem = async (type, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;

    // 1. Check if it's a suggested ingredient (from Page 1)
    if (type === "ingredient" && suggestedIngredients.includes(name)) {
      const updatedList = suggestedIngredients.filter(n => n !== name);
      const recipeId = localStorage.getItem("currentRecipeId");
      try {
        const res = await fetch(`${API_URL}/save-selection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipeId, ingredients: updatedList })
        });
        if (res.ok) {
          setSuggestedIngredients(updatedList);
          showToast(`Removed ${name} from recipe selections`);
          return;
        }
      } catch (err) {
        console.error("Error removing suggested ingredient:", err);
      }
    }

    const apiType = type === "tool" ? "other" : type;

    try {
      const response = await fetch(`${API_URL}/remove-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: apiType, name }),
      });

      const data = await response.json();
      if (data.message) {
        if (type === "ingredient") {
          setIngredients((prev) => prev.filter((i) => i.name !== name));
          setOtherIngredients((prev) => prev.filter((i) => i.name !== name));
        } else if (type === "action") {
          setActions((prev) => prev.filter((a) => a.name !== name));
        } else if (type === "descriptor") {
          setDescriptors((prev) => prev.filter((d) => d.name !== name));
        } else if (type === "tool") {
          setTools((prev) => prev.filter((t) => t.name !== name));
        }
        showToast(
          `${type.charAt(0).toUpperCase() + type.slice(1)} removed successfully`
        );
      } else {
        alert("Failed to remove item: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Error removing item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };

  const canGenerate = () => {
    const hasActionTam = currentInstruction.some(
      (c) => c.type === "action_tam"
    );
    const nouns = currentInstruction.filter(
      (c) => c.type === "ingredient" || c.type === "tool"
    );
    if (nouns.length === 0) return hasActionTam;

    // Each noun (ingredient or tool) must have a relation
    // Ingredients have a separate "relation" component after them
    // Tools have a .relation property inside them
    const ingredients = currentInstruction.filter(c => c.type === "ingredient");
    const relations = currentInstruction.filter(c => c.type === "relation");
    const toolsWithRelation = currentInstruction.filter(c => c.type === "tool" && c.relation);
    const toolsWithoutRelation = currentInstruction.filter(c => c.type === "tool" && !c.relation);

    if (toolsWithoutRelation.length > 0) return false;
    if (ingredients.length > relations.length) return false;

    return hasActionTam;
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = normLang === "hi" ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser.");
    }
  };

  const [lastSpokenText, setLastSpokenText] = useState("");

  /* ========= DRIVER.JS TOUR ========= */
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        { element: '.recipe-header-prominent', popover: { title: 'Welcome! 🍳', description: 'This tour will guide you through creating your recipe step-by-step.' } },
        { element: '.horizontal-palette', popover: { title: 'Ingredient Palette 🎨', description: 'Click on the tabs (Actions, Ingredients, etc.) to browse items.' } },
        { element: '.filter-controls', popover: { title: 'Search 🔍', description: 'Use the Search Bar in each tab to quickly find specific ingredients or actions.' } },
        { element: '.section-add-btn', popover: { title: 'Add Custom Item ➕', description: 'Can\'t find an item? Click "Add New" to create a custom ingredient, tool, or action.' } },
        { element: '.builder-panel', popover: { title: 'Instruction Builder 🛠️', description: 'Drag items here from the palette, or click them to add to your current step.' } },
        { element: '#btn-guided-voice', popover: { title: 'Guided Voice 🗣️', description: 'Prefer speaking? Use "Guided Voice" for a step-by-step audio assistant.' } },
        { element: '#btn-generate-instruction', popover: { title: 'Generate ✨', description: 'Once your items are in place, click "Generate Instruction" to process the text.' } },
        { element: '#btn-add-new-instruction', popover: { title: 'Add New Step 🚀', description: 'Ready for the next step? Click here to start a fresh sentence.' } },
        { element: '.split-result-area', popover: { title: 'Results View 📊', description: 'Check the generated USR, Graph, and your full Recipe History here.' } },
        { element: '.submit-dashboard-btn', popover: { title: 'Submit & Finish ✅', description: 'Finished all steps? Click "Submit" to save your complete recipe.' } }
      ]
    });
    driverObj.drive();
  };

  const handleAudioTranscription = async (text, data) => {
    // text is the transcribed English sentence
    // data is the full response from /api/audio/transcribe
    if (!data) return;

    setLastSpokenText(text);
    setLoading(true);
    try {
      setGraphImage(data.graph_image);
      setUsrTableHtml(renderUSRTable(data.usr_text));

      // Auto-trigger the English sentence generation and storage
      await sendUSRToExternalService(data.usr_text, data.graph_id, data.usr_id, isModifyMode, modifyingSentenceId);

      // We show the transcript in the builder, so we clear the chips
      // but the UI will now show the transcript box
      setCurrentInstruction([]);

      // Reload steps list so history is updated immediately
      const recipeId = localStorage.getItem("currentRecipeId");
      if (recipeId) {
        await loadPastSentences(recipeId);
      }

      showToast("Voice instruction processed!");
    } catch (err) {
      console.error("Error handling audio transcription:", err);
      alert("Error adding step via voice.");
    } finally {
      setLoading(false);
    }
  };

  // 🛑 GUARD: If no recipe is selected or user not logged in, show minimal loading
  if (!localStorage.getItem("user_id") || !localStorage.getItem("currentRecipeId")) {
    return (
      <div className="recipe-page" style={{ justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div className="loader-box">
          <div className="loader"></div>
          <p style={{ marginTop: "20px", color: "#64748b", fontWeight: "600" }}>Redirecting you...</p>
        </div>
      </div>
    );
  }

  // ==== RENDER ====
  return (
    <div className="recipe-page">
      <div className="recipe-card">
        {/* PROMINENT DESIGNER HEADER */}
        <header className="recipe-header-prominent">
          <div className="title-section">
            <div className="header-title-row">
              <h1 className="recipe-title">
                {recipeName || "noodles"}
              </h1>
            </div>

            <div className="type-badge">
              <span><span className="badge-label">Type:</span> {recipeType || "Breakfast"}</span>
              <span><span className="badge-label">Duration:</span> {recipeDuration || "N/A"} mins</span>
            </div>
          </div>

          <div className="header-actions">
            <button
              onClick={() => navigate("/page1")}
              className="back-link-btn"
              type="button"
            >
              ← {t("goBack")}
            </button>
            <button
              onClick={startTour}
              className="tour-start-btn"
              type="button"
              style={{ padding: "8px 16px", fontSize: "0.85rem", background: "#10b981", color: "white", border: "2px solid #059669", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)" }}
            >
              🚀 Take Tour
            </button>
            <button
              onClick={() => setShowHowToUse(true)}
              className="info-btn"
              type="button"
              style={{ padding: "6px 12px", fontSize: "0.7rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px" }}
            >
              📖 {t("howToUse") || "How to Use"}
            </button>
          </div>
        </header>



        {/* MAIN STACKED WORKSPACE */}
        <div className="workspace-stack">
          {/* 1. HORIZONTAL PALETTE */}
          <div className="horizontal-palette">
            <div className="mobile-palette-tabs">
              <button className={paletteTab === "actions" ? "active" : ""} onClick={() => setPaletteTab("actions")}>ACTIONS</button>
              <button className={paletteTab === "ingredients" ? "active" : ""} onClick={() => setPaletteTab("ingredients")}>INGREDIENTS</button>
              <button className={paletteTab === "descriptors" ? "active" : ""} onClick={() => setPaletteTab("descriptors")}>DESCRIPTORS</button>
              <button className={paletteTab === "tools" ? "active" : ""} onClick={() => setPaletteTab("tools")}>TOOLS</button>
              <button className={paletteTab === "temporal" ? "active" : ""} onClick={() => setPaletteTab("temporal")}>TEMPORAL</button>
              <button className={paletteTab === "recipes" ? "active" : ""} onClick={() => setPaletteTab("recipes")}>RECIPES</button>
              <button className={paletteTab === "verbs" ? "active" : ""} onClick={() => setPaletteTab("verbs")}>STATE</button>
              <button className={paletteTab === "nouns" ? "active" : ""} onClick={() => setPaletteTab("nouns")}>NOUNS</button>


            </div>
            <div className="palette-row">

              {/* 1. Actions */}
              <div className={`component-section ${paletteTab === 'actions' ? 'mobile-show' : 'mobile-hide'}`}>

                <div className="section-title" style={{ fontSize: "0.62rem" }}>⚡ {t("actionsTitle")}</div>
                <div className="filter-controls">
                  <input
                    type="text"
                    placeholder="🔍"
                    value={actionsSearch}
                    onChange={(e) => setActionsSearch(e.target.value)}
                    style={{ fontSize: "0.6rem", padding: "2px" }}
                  />
                </div>
                <div className="entity-grid" style={{ height: "220px" }}>
                  {actions
                    .filter(action => action.name.toLowerCase().includes(actionsSearch.toLowerCase()))
                    .map((action, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, "action", action.name, action.emoji)}
                        className="entity-card"
                        onClick={() => toggleItemSelection("action", action.name, action.emoji)}
                      >
                        <input
                          type="checkbox"
                          checked={currentInstruction.some(c => c.actionName === action.name)}
                          onChange={(e) => { e.stopPropagation(); toggleItemSelection("action", action.name, action.emoji); }}
                        />
                        <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>{action.emoji}</span>
                        <span className="entity-name">{action.displayName || action.name}</span>
                        <span className="palette-item-remove" onClick={(e) => { e.stopPropagation(); removeItem("action", action.name); }}>×</span>
                      </div>
                    ))}
                </div>
                <button className="section-add-btn" onClick={() => setShowActionForm(true)}>
                  <span className="add-icon">➕</span> Add New Action
                </button>

              </div>



              {/* 2. Ingredients */}
              <div className={`component-section ${paletteTab === 'ingredients' ? 'mobile-show' : 'mobile-hide'}`}>

                <div className="section-title" style={{ fontSize: "0.62rem" }}>🥄 {t("ingredientsTitle")}</div>
                <div className="filter-controls">
                  <input
                    type="text"
                    placeholder="🔍"
                    value={ingredientPaletteSearch}
                    onChange={(e) => setIngredientPaletteSearch(e.target.value)}
                    style={{ fontSize: "0.6rem", padding: "2px" }}
                  />
                </div>
                <div className="entity-grid" style={{ height: "220px" }}>
                  {filteredIngredients
                    .map((ing, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, "ingredient", ing.name, ing.emoji)}
                        className="entity-card"
                        onClick={() => toggleItemSelection("ingredient", ing.name, ing.emoji)}
                      >
                        <input
                          type="checkbox"
                          checked={currentInstruction.some(c => c.value === ing.name)}
                          onChange={(e) => { e.stopPropagation(); toggleItemSelection("ingredient", ing.name, ing.emoji); }}
                        />
                        <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>{ing.emoji}</span>
                        <span className="entity-name">{ing.displayName || ing.name}</span>
                        <span className="palette-item-remove" onClick={(e) => { e.stopPropagation(); removeItem("ingredient", ing.name); }}>×</span>
                      </div>
                    ))}
                </div>
                <button className="section-add-btn" onClick={() => setShowIngredientForm(true)}>
                  <span className="add-icon">➕</span> Add New Ingredient
                </button>
              </div>

              {/* 3. Descriptors */}
              <div className={`component-section ${paletteTab === 'descriptors' ? 'mobile-show' : 'mobile-hide'}`}>

                <div className="section-title" style={{ fontSize: "0.62rem" }}>📝 {t("descriptorsTitle")}</div>
                <div className="filter-controls">
                  <input
                    type="text"
                    placeholder="🔍"
                    value={descriptorsSearch}
                    onChange={(e) => setDescriptorsSearch(e.target.value)}
                    style={{ fontSize: "0.6rem", padding: "2px" }}
                  />
                </div>
                <div className="entity-grid" style={{ height: "220px" }}>
                  {descriptors
                    .filter(desc => desc.name.toLowerCase().includes(descriptorsSearch.toLowerCase()))
                    .map((desc, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, "descriptor", desc.name, desc.emoji)}
                        className="entity-card"
                        onClick={() => toggleItemSelection("descriptor", desc.name, desc.emoji)}
                      >
                        <input
                          type="checkbox"
                          checked={currentInstruction.some(c => c.value === desc.name)}
                          onChange={(e) => { e.stopPropagation(); toggleItemSelection("descriptor", desc.name, desc.emoji); }}
                        />
                        <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>{desc.emoji}</span>
                        <span className="entity-name">{desc.displayName || desc.name}</span>
                        <span className="palette-item-remove" onClick={(e) => { e.stopPropagation(); removeItem("descriptor", desc.name); }}>×</span>
                      </div>
                    ))}
                </div>
                <button className="section-add-btn" onClick={() => setShowDescriptorForm(true)}>
                  <span className="add-icon">➕</span> Add New Descriptor
                </button>
              </div>

              {/* 4. Tools */}
              <div className={`component-section ${paletteTab === 'tools' ? 'mobile-show' : 'mobile-hide'}`}>

                <div className="section-title" style={{ fontSize: "0.62rem" }}>🧰 Tools</div>
                <div className="filter-controls">
                  <input
                    type="text"
                    placeholder="🔍"
                    value={toolsSearch}
                    onChange={(e) => setToolsSearch(e.target.value)}
                    style={{ fontSize: "0.6rem", padding: "2px" }}
                  />
                </div>
                <div className="entity-grid" style={{ height: "220px" }}>
                  {tools
                    .filter(tool => tool.name.toLowerCase().includes(toolsSearch.toLowerCase()))
                    .map((tool, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, "tool", tool.name, tool.emoji)}
                        className="entity-card"
                        onClick={() => toggleItemSelection("tool", tool.name, tool.emoji)}
                      >
                        <input
                          type="checkbox"
                          checked={currentInstruction.some(c => c.value === tool.name)}
                          onChange={(e) => { e.stopPropagation(); toggleItemSelection("tool", tool.name, tool.emoji); }}
                        />
                        <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>{tool.emoji}</span>
                        <span className="entity-name">{tool.name}</span>
                        <span className="palette-item-remove" onClick={(e) => { e.stopPropagation(); removeItem("tool", tool.name); }}>×</span>
                      </div>
                    ))}
                </div>
                <button className="section-add-btn" onClick={() => setShowToolForm(true)}>
                  <span className="add-icon">➕</span> Add New Tool
                </button>
              </div>

              {/* 5. Temporal & Other Nouns (Combined) */}
              <div className={`component-section ${(paletteTab === 'temporal' || paletteTab === 'nouns') ? 'mobile-show' : 'mobile-hide'}`}>

                {/* TOP HALF: TEMPORAL */}
                <div style={{ height: "50%", display: "flex", flexDirection: "column", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                  <div className="section-title" style={{ fontSize: "0.62rem" }}>⌛ TEMPORAL CONTEXT</div>
                  <div className="filter-controls">
                    <input
                      type="text"
                      placeholder="Search temporal..."
                      value={temporalSearch}
                      onChange={(e) => setTemporalSearch(e.target.value)}
                      style={{ fontSize: "0.6rem", padding: "2px" }}
                    />
                  </div>
                  <div className="entity-grid" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
                    {/* A. DAY CONDITIONS */}
                    <div className="temporal-subgroup">
                      <div
                        className="sub-heading"
                        onClick={() => setShowDay(!showDay)}
                        style={{ fontSize: "0.65rem", padding: "4px", background: "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}
                      >
                        <span>A. DAY CONDITIONS</span>
                        <span>{showDay ? "▼" : "▶"}</span>
                      </div>
                      {showDay && (
                        <div className="sub-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", padding: "4px" }}>
                          {temporalContext.dayConditions.filter(i => i.toLowerCase().includes(temporalSearch.toLowerCase())).map((item, idx) => (
                            <div key={idx} className="entity-card" onClick={() => toggleItemSelection("temporal", item, "⏱️")} style={{ fontSize: "0.6rem" }}>
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* B. TIME CONDITIONS */}
                    <div className="temporal-subgroup">
                      <div
                        className="sub-heading"
                        onClick={() => setShowTime(!showTime)}
                        style={{ fontSize: "0.65rem", padding: "4px", background: "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}
                      >
                        <span>B. TIME CONDITIONS</span>
                        <span>{showTime ? "▼" : "▶"}</span>
                      </div>
                      {showTime && (
                        <div className="sub-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", padding: "4px" }}>
                          {temporalContext.timeConditions.filter(i => i.toLowerCase().includes(temporalSearch.toLowerCase())).map((item, idx) => (
                            <div key={idx} className="entity-card" onClick={() => toggleItemSelection("temporal", item, "⏱️")} style={{ fontSize: "0.6rem" }}>
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* C. DURATION CONDITIONS */}
                    <div className="temporal-subgroup">
                      <div
                        className="sub-heading"
                        onClick={() => setShowDuration(!showDuration)}
                        style={{ fontSize: "0.65rem", padding: "4px", background: "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}
                      >
                        <span>C. DURATION CONDITIONS</span>
                        <span>{showDuration ? "▼" : "▶"}</span>
                      </div>
                      {showDuration && (
                        <div className="sub-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", padding: "4px" }}>
                          {temporalContext.durationConditions.filter(i => i.toLowerCase().includes(temporalSearch.toLowerCase())).map((item, idx) => (
                            <div key={idx} className="entity-card" onClick={() => toggleItemSelection("temporal", item, "⏱️")} style={{ fontSize: "0.6rem" }}>
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTTOM HALF: OTHER NOUNS */}
                <div style={{ height: "50%", display: "flex", flexDirection: "column", paddingTop: "4px" }}>
                  <div className="section-title" style={{ fontSize: "0.62rem" }}>📦 Other Nouns</div>
                  <div className="filter-controls">
                    <input
                      type="text"
                      placeholder="🔍"
                      value={ingredientPaletteSearch}
                      onChange={(e) => setIngredientPaletteSearch(e.target.value)}
                      style={{ fontSize: "0.6rem", padding: "2px" }}
                    />
                  </div>
                  <div className="entity-grid" style={{ flex: 1, overflowY: "auto" }}>
                    {otherIngredients
                      .filter(noun => noun.name.toLowerCase().includes(ingredientPaletteSearch.toLowerCase()))
                      .map((noun, idx) => (
                        <div
                          key={idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, "tool", noun.name, noun.emoji)}
                          className="entity-card"
                          onClick={() => toggleItemSelection("tool", noun.name, noun.emoji)}
                        >
                          <input
                            type="checkbox"
                            checked={currentInstruction.some(c => c.value === noun.name)}
                            onChange={(e) => { e.stopPropagation(); toggleItemSelection("tool", noun.name, noun.emoji); }}
                          />
                          <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>{noun.emoji}</span>
                          <span className="entity-name">{noun.displayName || noun.name}</span>
                          <span className="palette-item-remove" onClick={(e) => { e.stopPropagation(); removeItem("other", noun.name); }}>×</span>
                        </div>
                      ))}
                  </div>
                  <button className="section-add-btn" onClick={() => setShowOtherNounForm(true)}>
                    <span className="add-icon">➕</span> Add New Noun
                  </button>
                </div>
              </div>

              {/* 6. Recipes & State (Combined) */}
              <div className={`component-section ${(paletteTab === 'recipes' || paletteTab === 'verbs') ? 'mobile-show' : 'mobile-hide'}`}>

                {/* TOP HALF: RECIPES */}
                <div style={{ height: "50%", display: "flex", flexDirection: "column", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                  <div className="section-title" style={{ fontSize: "0.62rem" }}>📖 Recipes</div>
                  <div className="filter-controls">
                    <input
                      type="text"
                      placeholder="🔍"
                      value={recipesSearch}
                      onChange={(e) => setRecipesSearch(e.target.value)}
                      style={{ fontSize: "0.6rem", padding: "2px" }}
                    />
                  </div>
                  <div className="entity-grid" style={{ flex: 1, overflowY: "auto" }}>
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, "ingredient", recipeName, "🍲")}
                      className="entity-card current-recipe-card"
                      onClick={() => toggleItemSelection("ingredient", recipeName, "🍲")}
                    >
                      <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>🍲</span>
                      <span className="entity-name">{recipeName}</span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM HALF: STATE */}
                <div style={{ height: "50%", display: "flex", flexDirection: "column", paddingTop: "4px" }}>
                  <div className="section-title" style={{ fontSize: "0.62rem" }}>🗣️ {t("verbsTitle")}</div>
                  <div className="entity-grid" style={{ flex: 1, overflowY: "auto" }}>
                    <div
                      className="entity-card"
                      onClick={() => toggleItemSelection("action", "be", "🔵", true)}
                    >
                      <input
                        type="checkbox"
                        checked={currentInstruction.some(c => c.actionName === "be" && c.isBeVerb)}
                        onChange={(e) => { e.stopPropagation(); toggleItemSelection("action", "be", "🔵", true); }}
                      />
                      <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>🔵</span>
                      <span className="entity-name">be</span>
                    </div>
                  </div>
                  <button className="section-add-btn" onClick={() => setShowActionForm(true)}>
                    <span className="add-icon">➕</span> Add New State
                  </button>
                </div>
              </div>

              {/* 8. NOUNS (Moved to Temporal) */}
            </div>
          </div>


          {/* 2. DROP ZONE (Full Width) */}
          <section className="builder-panel panel">
            <div className="panel-header" style={{ padding: "4px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="panel-title" style={{ fontSize: "0.65rem", fontWeight: "500" }}>🛠️ {t("instructionBuilderTitle")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  id="btn-guided-voice"
                  onClick={() => setShowGuidedVoice(true)}
                  style={{ fontSize: "0.6rem", padding: "4px 8px", borderRadius: "6px", background: "#f1f5f9", border: "1px solid #e2e8f0", cursor: "pointer" }}
                >
                  🎧 Guided Voice
                </button>
                <AudioInput
                  onTranscriptionSuccess={(text, data) => handleAudioTranscription(text, data)}
                  recipeId={localStorage.getItem("currentRecipeId")}
                />
              </div>
            </div>
            <div className="panel-scroll" style={{ padding: "6px" }}>
              <div
                className={`drop-zone ${dragOver ? "drag-over" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ padding: "8px", minHeight: "60px", borderRadius: "12px" }}
              >
                <div className="instruction-builder" style={{ gap: "6px", minHeight: "40px", flexDirection: "column", alignItems: "flex-start" }}>
                  {currentInstruction.length === 0 && !lastSpokenText ? (
                    <div className="placeholder-text" style={{ fontSize: "0.6rem", padding: "8px", textAlign: "center", width: "100%" }}>
                      {t("placeholderText")}
                    </div>
                  ) : lastSpokenText && currentInstruction.length === 0 ? (
                    <div className="voice-transcript-box" style={{
                      width: "100%",
                      padding: "10px",
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "#0369a1" }}>
                          {currentInstruction.length === 0 && lastSpokenText.includes(" ") ? "📝 Instruction Transcript" : "🎙️ Voice Transcript"}
                        </span>
                        <button
                          onClick={() => setLastSpokenText("")}
                          style={{ border: "none", background: "none", color: "#0369a1", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#0c4a6e", fontWeight: "500", fontStyle: "italic" }}>
                        <strong>Transcribed Text:</strong> "{lastSpokenText}"
                      </div>
                      <div style={{ fontSize: "0.55rem", color: "#64748b" }}>
                        Transcript processed and added to history.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {currentInstruction.map((comp, idx) => (
                        <div key={idx} className={`dropped-chip ${comp.type}`} style={{ padding: "3px 8px", fontSize: "0.62rem", borderRadius: "8px" }}>
                          <span className="chip-emoji">{comp.emoji}</span>
                          <span className="chip-text">{comp.actionName || (comp.value && String(comp.value).replace(/-/g, " "))}</span>
                          {comp.type === "ingredient" && (
                            <div className="ingredient-meta" style={{ display: "flex", gap: "4px", marginLeft: "4px" }}>
                              <input
                                type="text"
                                className="ingredient-qty-input"
                                placeholder="Qty"
                                value={comp.quantity || ""}
                                onChange={(e) => updateIngredientQuantity(idx, e.target.value)}
                                style={{ width: "35px", fontSize: "0.6rem", padding: "2px" }}
                              />
                              <UnitDropdown
                                value={comp.measurement || ""}
                                onSelect={(val) => updateIngredientMeasurement(idx, val)}
                              />
                            </div>
                          )}
                          <button className="dropped-remove" onClick={() => removeComponent(idx)} style={{ marginLeft: "4px" }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="builder-toolbar" style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px", gap: "10px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  {(pastInstructions.length > 0 || englishSentences.length > 0) && (
                    <button
                      className="generate-btn highlight-pulse"
                      id="btn-add-new-instruction"
                      onClick={handleAddNewInstruction}
                      style={{
                        padding: "10px 24px",
                        fontSize: "0.92rem",
                        borderRadius: "14px",
                        background: "#10b981",
                        color: "white",
                        border: "2px solid #059669",
                        fontWeight: "800",
                        boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}
                    >
                      🚀 {t("addNewInstruction")}
                    </button>
                  )}
                  <button
                    className="generate-btn"
                    id="btn-generate-instruction"
                    onClick={generateInstruction}
                    disabled={!canGenerate()}
                    style={{ padding: "8px 20px", fontSize: "0.852rem", borderRadius: "12px" }}
                  >
                    ✨ {t("generateInstruction")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. SPLIT RESULT AREA (3 boxes) */}
          < div className="output-view-header mobile-only" >
            <div className="panel-title" style={{ padding: "10px", fontWeight: "600", fontSize: "1rem" }}>📋 Output View</div>
          </div >
          <div className="mobile-output-tabs">
            <button className={outputTab === "usr" ? "active" : ""} onClick={() => setOutputTab("usr")}>USR</button>
            <button className={outputTab === "graph" ? "active" : ""} onClick={() => setOutputTab("graph")}>Graph</button>
            <button className={outputTab === "history" ? "active" : ""} onClick={() => setOutputTab("history")}>History</button>
          </div>
          <div className="split-result-area">
            {/* Box 1: USR Table */}
            <section className={`panel ${outputTab === 'usr' ? 'mobile-show' : 'mobile-hide'}`}>

              <div className="panel-header" style={{ padding: "4px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="panel-title" style={{ fontSize: "0.65rem", fontWeight: "500" }}>📋 {t("generatedUSR")}</div>
              </div>

              <div className="panel-scroll" style={{ padding: "0", height: "300px", overflowY: "auto" }}>
                {usrTableHtml ? (
                  <div
                    onClick={() => setShowUSRModal(true)}
                    style={{ cursor: "zoom-in", paddingBottom: "10px" }}
                    title="Click to enlarge USR Table"
                  >
                    <div className="compact-usr" style={{ fontSize: "0.6rem" }} dangerouslySetInnerHTML={{ __html: usrTableHtml }} />
                    <div style={{ fontSize: "0.55rem", color: "#64748b", marginTop: "4px", textAlign: "center" }}>Click to enlarge (🔍)</div>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.6rem", color: "#94a3b8", padding: "40px", textAlign: "center" }}>USR Table will appear here</div>
                )}
              </div>
            </section>

            {/* Box 2: Graph */}
            <section className={`panel ${outputTab === 'graph' ? 'mobile-show' : 'mobile-hide'}`}>

              <div className="panel-header" style={{ padding: "4px 10px" }}><div className="panel-title" style={{ fontSize: "0.65rem", fontWeight: "500" }}>📊 {t("generatedGraph")}</div></div>
              <div className="panel-scroll" style={{ padding: "10px", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
                {graphImage ? (
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e0", display: "inline-block", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                    <img
                      src={graphImage}
                      alt="Graph"
                      style={{ maxWidth: "160px", maxHeight: "240px", borderRadius: "8px", cursor: "pointer", transition: "transform 0.2s" }}
                      onClick={() => setShowGraphModal(true)}
                      onMouseOver={(e) => e.target.style.transform = "scale(1.02)"}
                      onMouseOut={(e) => e.target.style.transform = "scale(1)"}
                    />
                    <div style={{ fontSize: "0.55rem", color: "#64748b", marginTop: "6px" }}>Click to enlarge</div>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.6rem", color: "#94a3b8", padding: "40px 0" }}>Graph will appear here</div>
                )}
              </div>
            </section>

            {/* Box 3: History & Sentences */}
            <section className={`panel ${outputTab === 'history' ? 'mobile-show' : 'mobile-hide'}`}>

              <div className="panel-header" style={{ padding: "4px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                <div className="panel-title" style={{ fontSize: "0.8rem", fontWeight: "600" }}>📜 {t("stepsForRecipe")}</div>
                {(englishSentences.length > 0 || pastInstructions.length > 0) && (
                  <div style={{ color: "#22c55e", fontSize: "0.7rem", fontWeight: "600" }}>Steps</div>
                )}
                {showAddNewPopup && (
                  <div style={{
                    position: "absolute",
                    top: "-45px",
                    right: "0",
                    background: "#166534",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.65rem",
                    fontWeight: "600",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    animation: "fadeInUp 0.3s ease",
                    zIndex: 10
                  }}>
                    Click here to generate a new sentence!
                  </div>
                )}
              </div>
              <div className="panel-scroll" style={{ padding: "6px", height: "300px", overflowY: "auto" }}>
                {/* Generated Sentences */}
                {englishSentences.length > 0 && (
                  <div className="panel-card" style={{ marginBottom: "8px", padding: "8px", background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "10px" }}>
                    {lastSpokenText && (
                      <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "6px", borderBottom: "1px solid #dcfce7", pb: "4px" }}>
                        {lastSpokenText.includes(" ") && !currentInstruction.some(c => c.value === lastSpokenText) ? "📝" : "🗣️"}
                        <strong> {lastSpokenText.includes(" ") ? "Instruction:" : "You said:"}</strong> "{lastSpokenText}"
                      </div>
                    )}
                    <div style={{ fontSize: "0.62rem", color: "#166534", marginBottom: "4px", fontWeight: "700" }}>✨ Generated Result:</div>
                    <ul style={{ paddingLeft: "12px", margin: 0 }}>
                      {englishSentences.map((s, idx) => (
                        <li key={idx}
                          style={{ fontSize: "0.62rem", marginBottom: "2px", cursor: "pointer" }}
                          onClick={() => handlePastSentenceClick(selectedSentenceId)}
                          onDoubleClick={() => {
                            setLastSpokenText(s);
                            setCurrentInstruction([]);
                            showToast("Loaded into builder");
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{s}</span>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button onClick={() => speakText(s)} title="Speak" style={{ border: "none", background: "none", cursor: "pointer", fontSize: "0.7rem" }}>🔊</button>
                              <button onClick={() => removeSentence(s)} style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", padding: "0 4px" }}>×</button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Past Instructions */}
                <div className="generated-instructions">
                  {pastInstructions.length > 0 ? (
                    pastInstructions.map((inst, index) => (
                      <div key={index} className="generated-step"
                        style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        onClick={() => handlePastSentenceClick(inst.sentence_id)}
                        onDoubleClick={() => {
                          setLastSpokenText(inst.text);
                          setCurrentInstruction([]);
                          showToast("Loaded into builder");
                        }}
                      >
                        <span style={{ fontSize: "0.62rem", flex: 1, paddingRight: "8px" }}><strong>#{index + 1}:</strong> {inst.text}</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={(e) => { e.stopPropagation(); speakText(inst.text); }} title="Speak" style={{ border: "none", background: "none", cursor: "pointer", fontSize: "0.7rem" }}>🔊</button>
                          <button
                            title="Download USR"
                            onClick={(e) => { e.stopPropagation(); handleDownloadStep(inst); }}
                            style={{ border: "none", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontSize: "0.6rem", padding: "2px 4px", borderRadius: "4px" }}
                          >
                            ⬇️
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); removeGeneratedStep(index); }} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", padding: "0 4px" }}>×</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: "0.6rem", color: "#94a3b8", textAlign: "center", padding: "20px" }}>No steps yet</div>
                  )}
                </div>
              </div>
              {/* Submit Footer */}
              <div style={{ padding: "6px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                <button
                  className="submit-dashboard-btn"
                  onClick={() => setShowModal(true)}
                  disabled={pastInstructions.length < 2}
                  style={{ padding: "4px 12px", fontSize: "0.65rem", borderRadius: "6px" }}
                >
                  ✅ {t("submit")}
                </button>
              </div>
            </section>
          </div>
        </div >

        {/* Loader */}
        {
          loading && (
            <div
              id="loader"
              style={{
                display: "flex",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(255,255,255,0.8)",
                zIndex: 9999,
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div>
                <div
                  style={{
                    border: "6px solid #f3f3f3",
                    borderTop: "6px solid #22c55e",
                    borderRadius: "50%",
                    width: "60px",
                    height: "60px",
                    animation: "spin 1s linear infinite",
                    margin: "auto",
                  }}
                />
                <p style={{ fontWeight: 600, marginTop: "10px" }}>
                  Generating sentence… please wait
                </p>
              </div>
            </div>
          )
        }

        {/* Submit Modal */}
        {
          showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h5 className="modal-title">{t("finalCheckTitle")}</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setShowModal(false)}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <h1>{t("finalCheckBody")}</h1>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    {t("backToEdit")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate("/page3")}
                  >
                    {t("continueToSubmit")}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Graph Zoom Modal */}
        {
          showGraphModal && graphImage && (
            <div className="modal-overlay" onClick={() => setShowGraphModal(false)}>
              <div className="graph-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ marginBottom: "6px" }}>
                  <h5 className="modal-title">{t("generatedGraph")} (Full View)</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setShowGraphModal(false)}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <img src={graphImage} alt="Graph large" />
              </div>
            </div>
          )
        }

        {/* USR Table Zoom Modal */}
        {
          showUSRModal && usrTableHtml && (
            <div className="modal-overlay" onClick={() => setShowUSRModal(false)}>
              <div className="usr-modal" onClick={(e) => e.stopPropagation()} style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                maxWidth: "90vw",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}>
                <div className="modal-header" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 className="modal-title" style={{ fontSize: "1.2rem", fontWeight: "700", color: "#065f46" }}>📋 {t("generatedUSR")} (Full View)</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setShowUSRModal(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1.5rem",
                      cursor: "pointer",
                      color: "#64748b"
                    }}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: usrTableHtml }} style={{ fontSize: "1rem" }} />
              </div>
            </div>
          )
        }



        {/* POPUPS */}
        {
          showSemanticPopup && (
            <SemanticPopup
              onConfirm={confirmSemanticCategory}
              onSkip={skipSemanticCategory}
              onCancel={() => setShowSemanticPopup(false)}
              semanticOptions={semanticOptions}
              morphoOptions={morphoOptions}
            />
          )
        }

        {
          showTemporalSemanticPopup && (
            <SemanticPopup
              onConfirm={confirmTemporalSemanticCategory}
              onSkip={skipTemporalSemanticCategory}
              onCancel={() => setShowTemporalSemanticPopup(false)}
              semanticOptions={semanticOptions}
              morphoOptions={morphoOptions}
            />
          )
        }

        {
          showTAMSelector && (
            <TAMSelector
              tams={tams}
              onConfirm={confirmTAM}
              onCancel={() => setShowTAMSelector(false)}
            />
          )
        }

        {
          showDurationPopup && (
            <div className="popup-overlay" onClick={() => setShowDurationPopup(false)}>
              <div className="popup-box" onClick={(e) => e.stopPropagation()}>
                <h3>Enter Duration</h3>

                <input
                  type="text"
                  placeholder="e.g. 3-5"
                  value={durationNumberInput}
                  onChange={(e) => setDurationNumberInput(e.target.value)}
                />

                <select
                  value={durationUnitInput}
                  onChange={(e) => setDurationUnitInput(e.target.value)}
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                </select>

                <button
                  onClick={() => {
                    const num = durationNumberInput.trim();
                    if (!num) return alert("Enter duration (e.g. 5 or 3-5)");

                    const comp = {
                      type: "temporal",
                      value: `${num} ${durationUnitInput}`,
                      durationNumber: num,
                      durationUnit: durationUnitInput,
                      emoji: "⏱️",
                    };

                    setCurrentInstruction((prev) => [...prev, comp]);
                    setShowDurationPopup(false);
                    setDurationNumberInput("");
                    setShowRelationPrompt(true);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          )
        }



        {
          showRelationPrompt && (
            <RelationPrompt
              onConfirm={confirmRelation}
              onSkip={() => setShowRelationPrompt(false)}
              type={currentInstruction[currentInstruction.length - 1]?.type}
              currentItem={currentInstruction[currentInstruction.length - 1]}
            />
          )
        }

        {
          showIngredientForm && (
            <AddItemForm
              title="Add New Ingredient"
              onAdd={addNewIngredient}
              onCancel={() => setShowIngredientForm(false)}
            />
          )
        }

        {
          showActionForm && (
            <AddItemForm
              title="Add New Action"
              onAdd={addNewAction}
              onCancel={() => setShowActionForm(false)}
            />
          )
        }

        {
          showDescriptorForm && (
            <AddItemForm
              title="Add New Descriptor"
              onAdd={addNewDescriptor}
              onCancel={() => setShowDescriptorForm(false)}
            />
          )
        }

        {
          showToolForm && (
            <AddItemForm
              title="Add New Tool"
              onAdd={addNewTool}
              onCancel={() => setShowToolForm(false)}
            />
          )
        }

        {
          showTemporalForm && (
            <AddItemForm
              title="Add New Temporal Item"
              onAdd={addNewTemporal}
              onCancel={() => setShowTemporalForm(false)}
            />
          )
        }

        {
          showOtherNounForm && (
            <AddItemForm
              title="Add New Noun"
              onAdd={addNewOtherNoun}
              onCancel={() => setShowOtherNounForm(false)}
            />
          )
        }

        {
          showHowToUse && (
            <div className="modal-overlay" onClick={() => setShowHowToUse(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
                <div className="modal-header">
                  <h5 className="modal-title">📖 How to Use Recipe Generator</h5>
                  <button type="button" className="close" onClick={() => setShowHowToUse(false)}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body" style={{ textAlign: "left" }}>
                  <ol>
                    <li><strong>Select Action:</strong> Click an action (e.g., 🔪 Cut) from the palette to add it. Then select the appropriate TAM (Tense-Aspect-Modality).</li>
                    <li><strong>Add Ingredients:</strong> Click ingredients to add them. If you add more than one, you'll be asked how to connect them (e.g., "and" / "or").</li>
                    <li><strong>Compound Words:</strong> If an ingredient has multiple words (e.g., Black Pepper), use a hyphen: <code>black-pepper</code>. The system handles this automatically!</li>
                    <li><strong>Generate:</strong> Click "Generate Sentence" to see the result, USR, and Graph.</li>
                    <li><strong>Voice Assistance:</strong> Click the 🎙️ icon to speak an instruction (e.g., "Heat the oil"). You can also use 🎧 <strong>Guided Voice</strong> for a step-by-step recording assistant.</li>
                    <li><strong>Add New:</strong> Click "Add New Sentence" to start the next step.</li>
                    <li><strong>Combine Steps:</strong> Once you have at least <strong>two steps</strong>, click "Next: Sentence Relations" to combine them into a story.</li>
                  </ol>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={() => setShowHowToUse(false)}>Got it!</button>
                </div>
              </div>
            </div>
          )
        }

        {
          showGuidedVoice && (
            <GuidedAudioInput
              recipeId={localStorage.getItem("currentRecipeId")}
              onCancel={() => setShowGuidedVoice(false)}
              onComplete={async (sentence) => {
                setShowGuidedVoice(false);
                // We send the sentence to the same handleAudioTranscription logic
                // But we first need to get the transcription data for it.
                // Actually, let's just send it to a new backend endpoint
                // that processes text just like audio_transcribe does.
                setLoading(true);
                try {
                  const res = await fetch(`${API_URL}/api/audio/process-text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: sentence, recipe_id: localStorage.getItem("currentRecipeId") })
                  });
                  const data = await res.json();
                  if (data.usr_text) {
                    handleAudioTranscription(sentence, data);
                  }
                } catch (err) {
                  console.error("Error processing guided sentence:", err);
                } finally {
                  setLoading(false);
                }
              }}
            />
          )
        }

        {
          showConnectionPrompt && (
            <div className="modal-overlay" onClick={() => { setShowConnectionPrompt(false); setPendingIngredientForConnection(null); }}>
              <div className="popup-box" onClick={(e) => e.stopPropagation()} style={{ padding: "24px", minWidth: "300px", background: "white", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
                <h3 style={{ marginBottom: "16px", color: "#10b981", fontSize: "1.2rem", fontWeight: "800" }}>🔗 Connect Ingredients</h3>
                <p style={{ marginBottom: "24px", fontSize: "0.95rem", color: "#475569" }}>
                  How should <strong>{pendingIngredientForConnection?.value}</strong> be connected to the previous ingredient?
                </p>
                <div className="popup-buttons" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "12px", background: "#10b981", border: "none", color: "white", borderRadius: "12px", fontWeight: "600" }}
                    onClick={() => {
                      const connection = { type: "connection", value: "and", emoji: "🔗" };
                      setCurrentInstruction(prev => [...prev, connection]);

                      // Find the previous relation to reuse
                      const lastRel = [...currentInstruction].reverse().find(c => c.type === "relation");

                      if (lastRel) {
                        // ✅ Automatically apply the previous relation without asking again
                        const ingredientWithRelation = {
                          ...pendingIngredientForConnection,
                          quantity: "",
                          measurement: "",
                        };

                        setCurrentInstruction(prev => [...prev, ingredientWithRelation]);

                        // Auto-apply the previous relation
                        const relationComponent = {
                          type: "relation",
                          value: lastRel.value,
                          emoji: "🔗",
                        };
                        setCurrentInstruction(prev => [...prev, relationComponent]);

                        setShowConnectionPrompt(false);
                        setPendingIngredientForConnection(null);
                      } else {
                        // No previous relation found, ask for semantics
                        setPendingIngredient(pendingIngredientForConnection);
                        setShowSemanticPopup(true);
                        setShowConnectionPrompt(false);
                        setPendingIngredientForConnection(null);
                      }
                    }}
                  >
                    AND (और)
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "12px", background: "#10b981", border: "none", color: "white", borderRadius: "12px", fontWeight: "600" }}
                    onClick={() => {
                      const connection = { type: "connection", value: "or", emoji: "🔗" };
                      setCurrentInstruction(prev => [...prev, connection]);

                      // Find the previous relation to reuse
                      const lastRel = [...currentInstruction].reverse().find(c => c.type === "relation");

                      if (lastRel) {
                        // ✅ Automatically apply the previous relation without asking again
                        const ingredientWithRelation = {
                          ...pendingIngredientForConnection,
                          quantity: "",
                          measurement: "",
                        };

                        setCurrentInstruction(prev => [...prev, ingredientWithRelation]);

                        // Auto-apply the previous relation
                        const relationComponent = {
                          type: "relation",
                          value: lastRel.value,
                          emoji: "🔗",
                        };
                        setCurrentInstruction(prev => [...prev, relationComponent]);

                        setShowConnectionPrompt(false);
                        setPendingIngredientForConnection(null);
                      } else {
                        // No previous relation found, ask for semantics
                        setPendingIngredient(pendingIngredientForConnection);
                        setShowSemanticPopup(true);
                        setShowConnectionPrompt(false);
                        setPendingIngredientForConnection(null);
                      }
                    }}
                  >
                    OR (या)
                  </button>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ width: "100%", padding: "12px", background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: "12px", fontSize: "0.9rem" }}
                  onClick={() => {
                    setPendingIngredient(pendingIngredientForConnection);
                    setShowConnectionPrompt(false);
                    setShowSemanticPopup(true);
                    setPendingIngredientForConnection(null);
                  }}
                >
                  Skip Connection
                </button>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
};
/* ==== POPUP COMPONENTS (same as before) ==== */

const SemanticPopup = ({
  onConfirm,
  onSkip,
  onCancel,
  semanticOptions,
  morphoOptions,
}) => {
  const [semantic, setSemantic] = React.useState(semanticOptions[0] || "");
  const [morpho, setMorpho] = React.useState(morphoOptions[0] || "");

  const handleConfirm = () => {
    onConfirm(semantic, morpho);
  };

  return (
    <div className="modal-overlay">
      <div className="semantic-popup" style={{ maxWidth: "400px" }}>
        <h5 style={{ marginBottom: "16px", color: "#4c6fff", fontWeight: "700" }}>
          Select Morpho-Semantic
        </h5>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "6px", display: "block" }}>
              <strong>Morpho-Semantic</strong>
            </label>
            <select
              id="morphoSemanticSelect"
              className="form-control"
              value={morpho}
              onChange={(e) => setMorpho(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            >
              {morphoOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}
          >
            <button className="btn btn-primary" onClick={handleConfirm} style={{ flex: 1, padding: "12px", borderRadius: "10px", fontWeight: "600" }}>
              ✅ Confirm
            </button>
            <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
              ❌ Cancel
            </button>
          </div>
          <button className="btn btn-warning" onClick={onSkip} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
            ⏭️ Skip
          </button>
        </div>
      </div>
    </div>
  );
};

const TAMSelector = ({ tams, onConfirm, onCancel }) => {
  const [selectedTam, setSelectedTam] = React.useState(tams[0] || "");

  const handleConfirm = () => {
    if (!selectedTam) {
      alert("Please select a TAM.");
      return;
    }
    onConfirm(selectedTam);
  };

  return (
    <div className="modal-overlay">
      <div className="tam-selector-popup">
        <h5 style={{ marginBottom: "10px" }}>Select TAM</h5>
        <select
          id="tamSelect"
          value={selectedTam}
          onChange={(e) => setSelectedTam(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e0",
            marginBottom: "8px",
          }}
        >
          {tams.map((tam) => (
            <option key={tam} value={tam}>
              {tam}
            </option>
          ))}
        </select>
        <button
          onClick={handleConfirm}
          style={{
            width: "100%",
            padding: "8px",
            background: "#4c6fff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Confirm TAM
        </button>
        <button
          onClick={onCancel}
          style={{
            width: "100%",
            padding: "6px",
            marginTop: "8px",
            background: "#e2e8f0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};


const RelationPrompt = ({ onConfirm, onSkip, type, currentItem, currentInstruction }) => {
  const temporalRelations = [
    "When(time)-कितनी देर तक- अधिकरण/काल",
    "When(time)-कितने देर में- अधिकरण/काल",
    "When(time)-कब तक- अधिकरण/काल",
    "When(time)-कितनी  समय तक- अधिकरण/काल",
  ];

  const generalRelations = [
    "What (subject) - क्या-कर्ता",
    "What (object) - क्या-कर्म",
    "how-कैसे",
    "Whom (recipient) - किसके लिए-सम्प्रदान",
    "From where (source) - कहाँ से-अपादान",
    "Where (place) - कहाँ-अधिकरण/देश",
    "In - किस में",
    "on - किस पर",
    "Why (reason) - किस के कारण",
    "Like what - किस के समान",
    "With what - किससे",
    "Compared to what - किसके तुलना में",
    "Modifier - विशेषण/क्रिया विशेषण",
    "Quantity - मात्रा",
  ];

  // Check if we're dealing with action+descriptor (should use krvn)
  const isActionDescriptor = currentItem && currentItem.type === "descriptor" &&
    currentInstruction && currentInstruction.some(c => c.type === "action_tam");

  const relationOptions = (type === "temporal") ? temporalRelations : generalRelations;

  const [relation, setRelation] = React.useState(
    type === "descriptor"
      ? (isActionDescriptor
        ? "Action + Descriptor - क्रिया विशेषण (krvn)"
        : generalRelations.find(r => r.startsWith("Modifier")) || generalRelations[0])
      : relationOptions[0]
  );

  // Checking if item has numeric duration (e.g. "2 mins") or is a duration object
  const hasDuration = currentItem && (
    (currentItem.durationNumber) ||
    (typeof currentItem.value === 'string' && /\d/.test(currentItem.value) && type === 'temporal')
  );

  const [showTimeInputs, setShowTimeInputs] = React.useState(
    relationOptions[0].includes("When") && !hasDuration
  );
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [timeUnit, setTimeUnit] = React.useState("minutes");

  const handleRelationChange = (value) => {
    setRelation(value);
    // Only show inputs if relation is 'When...' AND we don't already have a duration
    setShowTimeInputs(value.includes("When") && !hasDuration);
  };

  const handleConfirm = () => {
    if (!relation) {
      alert("Please select a relation.");
      return;
    }
    const timeData =
      showTimeInputs && startTime && endTime
        ? { start: startTime, end: endTime, unit: timeUnit }
        : null;
    onConfirm(relation, timeData);
  };

  return (
    <div className="modal-overlay">
      <div className="relation-prompt">
        <h4 style={{ color: "#4c6fff", marginBottom: "10px" }}>
          🔗 Select Relation for this Item
        </h4>

        <select
          className="form-control mb-3"
          style={{ fontSize: "14px" }}
          value={relation}
          onChange={(e) => handleRelationChange(e.target.value)}
        >
          {relationOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {showTimeInputs && (
          <div id="timeSpanInputs" style={{ marginBottom: "12px" }}>
            <label>⏱️ Start Time:</label>
            <input
              type="text"
              id="startTime"
              className="form-control mb-2"
              placeholder="e.g. 5"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <label>⏱️ End Time:</label>
            <input
              type="text"
              id="endTime"
              className="form-control mb-2"
              placeholder="e.g. 10"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <label>Unit:</label>
            <select
              id="timeUnit"
              className="form-control mb-3"
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value)}
            >
              <option value="minutes">Minutes</option>
              <option value="seconds">Seconds</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleConfirm}
          >
            ✓ Confirm
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onSkip}
          >
            ⏭️ Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};

const AddItemForm = ({ title, onAdd, onCancel }) => {
  const [name, setName] = React.useState("");
  const [emoji, setEmoji] = React.useState("");
  const EMOJI_SHORTCUTS = ["🍳", "🥐", "🍞", "🥗", "🍲", "🧁", "🥛", "🍖", "🍤", "🌶️", "🧂"];

  const handleAdd = () => {
    if (!name.trim()) {
      alert("Please enter a name.");
      return;
    }

    if (!emoji.trim()) {
      alert("Please select an emoji or use one of the shortcuts.");
      return;
    }

    // normalize name to hyphenated form for internal use
    const normalized = name.trim().replace(/\s+/g, "-");
    onAdd(normalized, emoji.trim());
    setName("");
    setEmoji("");
  };

  return (
    <div className="modal-overlay">
      <div className="add-form-popup">
        <h5>{title}</h5>
        <input
          type="text"
          placeholder="Name (no spaces, use hyphens for multi-word)"
          className="add-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {EMOJI_SHORTCUTS.map((em) => (
              <button
                key={em}
                type="button"
                className="emoji-shortcut"
                onClick={() => setEmoji(em)}
                style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #eee", background: emoji === em ? "#eef" : "white", cursor: "pointer" }}
                title={`Select ${em}`}
              >
                {em}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>or paste emoji</div>
        </div>

        <input
          type="text"
          placeholder="Emoji (e.g., 🥖)"
          className="add-input"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />



        <div className="form-buttons">
          <button onClick={handleAdd} className="add-btn">
            Add
          </button>
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeVisualBuilder;