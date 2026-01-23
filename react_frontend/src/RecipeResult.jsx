// RecipeResult.jsx (RecipeVisualBuilder)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { API_URL } from "./config";
import "./recipeResult.css";
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
    const activeFilter = categoryFilter || "page1";

    // If search is active, search the entire ingredients list
    if (ingredientPaletteSearch.trim().length > 0) {
      const filtered = ingredients.filter((ing) =>
        ing.name.toLowerCase().includes(ingredientPaletteSearch.toLowerCase())
      );
      setFilteredIngredients(filtered);
    } else {
      // If not searching, ONLY show ingredients selected on Page 1 (filtered strictly)
      const selectedNamesLower = suggestedIngredients.map(s => s.trim().replace(/\s+/g, "-").toLowerCase());
      const filtered = ingredients.filter((ing) =>
        selectedNamesLower.includes(ing.name.toLowerCase())
      );
      setFilteredIngredients(filtered);
    }

    // If search yields no results across any category, show alert
    const checkSearch = (term, list, label) => {
      if (term.trim().length > 2) {
        const found = list.some(item => {
          if (!item) return false;
          const name = item.name || item.recipe_name || (typeof item === 'string' ? item : '');
          return name.toLowerCase().includes(term.toLowerCase());
        });

        if (!found) {
          const timer = setTimeout(() => {
            showToast(`${term} not found in ${label}`);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    };

    checkSearch(ingredientPaletteSearch, filteredIngredients, "Ingredients");
    checkSearch(actionsSearch, actions, "Actions");
    checkSearch(descriptorsSearch, descriptors, "Descriptors");
    checkSearch(toolsSearch, tools, "Tools");
    checkSearch(recipesSearch, [...userRecipes, recipeName], "Recipes");

  }, [ingredients, categoryFilter, suggestedIngredients, actions, descriptors, tools, otherIngredients, ingredientPaletteSearch, actionsSearch, descriptorsSearch, toolsSearch, recipesSearch]);

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
      const recipeId = localStorage.getItem("currentRecipeId");
      if (!recipeId) {
        alert("No recipe selected. Please create one first.");
        navigate("/page1");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/get-recipe/${recipeId}`);
        const data = await res.json();
        if (res.ok) {
          setRecipeName(data.recipe_name || "Unnamed Recipe");
          setRecipeType(data.recipe_type || "N/A");
          setRecipeDuration(data.cooking_time || data.cooking_duration || "N/A");
          setCategoryFilter(data.recipe_type || "all");

          const sIngs = data.ingredients || [];
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

      await loadAllItems("ingredient", normLang);
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

  // Load & translate palette items
  const loadAllItems = async (type, language) => {
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
            // Filter out non-suggested items that are being re-loaded
            const filteredPrev = prev.filter(p => suggestedIngredients.some(s => s.toLowerCase() === p.name.toLowerCase()));
            const newItems = uiItems.filter((i) => !i.isOther);

            // Merge: newItems + any suggested items that weren't in newItems
            const merged = [...newItems];
            filteredPrev.forEach(p => {
              if (!merged.some(m => m.name.toLowerCase() === p.name.toLowerCase())) {
                merged.push(p);
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
          const translated =
            normLang !== "en" ? await translateText(text, normLang, "en") : text;
          return {
            sentence_id: i.sentence_id || i.sentenceId || null,
            text: translated,
            raw_text: text,
            step_number: i.step_number || null,
            usr_id: i.usr_id || null,
            graph_id: i.graph_id || null,
            instruction_payload: i.instruction_payload || []
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

  const toggleItemSelection = (type, value, emoji) => {
    let finalValue = value;
    if (typeof value === "string") {
      finalValue = value.trim().replace(/\s+/g, "-");
    }

    // Basic logic to add item to currentInstruction
    if (type === "action") {
      setPendingAction({ value: finalValue, emoji });
      setShowTAMSelector(true);
    } else if (type === "temporal") {
      let temporalValue = finalValue;
      // prefixing removed for UI display - will be added in generateInstruction

      // mark placeholder items (containing 'X') as duration templates
      const isTemplate = typeof temporalValue === "string" && (temporalValue.includes("X") || temporalValue.toLowerCase().includes("for"));
      if (isTemplate) {
        setPendingDurationTemplate(temporalValue);
        setShowDurationPopup(true);
      } else {
        const temporalComponent = { value: temporalValue, emoji, type: "temporal" };
        setCurrentInstruction((prev) => [...prev, temporalComponent]);
        setShowRelationPrompt(true);
      }
    } else if (type === "tool") {
      const toolComponent = {
        type: "tool",
        value: finalValue,
        emoji,
        relation: null
      };
      setCurrentInstruction((prev) => [...prev, toolComponent]);
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
        // 🔥 IMPROVED: Only ask for connection if the PREVIOUS ingredient is still "open" (not yet followed by a relation)
        const lastIngIndex = [...currentInstruction].reverse().findIndex(c => c.type === "ingredient");
        const realLastIngIndex = lastIngIndex === -1 ? -1 : currentInstruction.length - 1 - lastIngIndex;

        const hasOpenIngredient = realLastIngIndex !== -1 &&
          !currentInstruction.slice(realLastIngIndex + 1).some(c => c.type === "relation");

        if (hasOpenIngredient) {
          setPendingIngredientForConnection(component);
          setShowConnectionPrompt(true);
        } else {
          setPendingIngredient(component);
          setShowSemanticPopup(true);
        }
      } else if (type === "descriptor") {
        setCurrentInstruction((prev) => [...prev, component]);
        setShowRelationPrompt(true);
      } else {
        setCurrentInstruction((prev) => [...prev, component]);
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
      const lastIngredientIndex = getLastIngredientIndex();
      if (
        lastIngredientIndex !== -1 &&
        !hasRelationAfterIndex(lastIngredientIndex)
      ) {
        alert("Please add a relation for the previous ingredient first.");
        return;
      }

      const ingredientComponent = {
        ...data,
        quantity: "",
        measurement: "",
      };

      // Check for connection if already has ingredients
      const hasExistingIngredient = currentInstruction.some(c => c.type === "ingredient");
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
      const stateDurations = ["golden", "brown", "cooked", "boiling", "soft", "aromatic", "fragrant", "smooth"];
      if (typeof val === "string") {
        const lower = val.toLowerCase();
        if (stateDurations.includes(lower)) {
          val = "until-" + val;
        } else if (lower === "overnight") {
          val = "for-" + val;
        }
      }

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
    if (type === "descriptor") {
      const stateDurations = ["golden", "brown", "cooked", "boiling", "soft", "aromatic", "fragrant", "smooth"];
      if (typeof itemValue === "string" && stateDurations.includes(itemValue.toLowerCase())) {
        itemValue = "until-" + itemValue;
      }
    }

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
  const confirmSemanticCategory = (semantic, morpho) => {
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
          if (next.type === "ingredient" || next.type === "connection") {
            moreInGroup = true;
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
      } else if (component.type === "descriptor") {
        let desc = component.value.toLowerCase();
        const stateDurations = ["golden", "gold", "golde", "brown", "cooked", "boiling", "soft", "soften", "aromatic", "fragrant", "smooth"];
        const isStateMatch = stateDurations.some(s => desc === s || desc.startsWith(s + "-") || desc.startsWith(s + " "));

        if (isStateMatch && !desc.startsWith("until-")) {
          desc = "until-" + desc;
        }

        let relation = "mod";
        if (["as-per-taste", "as-per-tastes"].includes(desc)) relation = "krvn";

        // 🔥 REFINED STICKY DESCRIPTOR LOGIC:
        const prevComp = currentInstruction[i - 1];
        let attachedToNoun = false;
        const canStick = !desc.startsWith("until-");

        if (canStick) {
          // 1. Check if we follow an ingredient currently in the pending group
          if (pendingIngsGroup.length > 0 && prevComp.type === "ingredient") {
            const lastIng = pendingIngsGroup[pendingIngsGroup.length - 1];
            lastIng.modifiers = lastIng.modifiers || [];
            lastIng.modifiers.push(desc);
            attachedToNoun = true;
          }
          // 2. Check if we follow a sealed SINGLE noun
          else {
            const lastNounRel = instruction.nounRelations[instruction.nounRelations.length - 1];
            // Only stick to "SimpleConcept" results, and only if we aren't currently building a new group
            if (lastNounRel && lastNounRel.relationType === "SimpleConcept" && pendingIngsGroup.length === 0) {
              const nounKey = lastNounRel.noun;
              if (nounKey) {
                lastNounRel.nounModifiers[nounKey] = lastNounRel.nounModifiers[nounKey] || [];
                lastNounRel.nounModifiers[nounKey].push(desc);
                attachedToNoun = true;
              }
            }
          }
        }

        if (!attachedToNoun) {
          const nextComp = currentInstruction[i + 1];
          if (nextComp && nextComp.type === "relation") {
            relation = nextComp.value;
            i++;
          }
          instruction.descriptors.push({ value: desc, relation: relation, actionIndex: currentActionIndex });
        }
      } else if (component.type === "temporal") {
        let val = component.durationNumber || component.value;
        let lowerVal = String(val).toLowerCase();

        const stateDurations = ["golden", "gold", "golde", "brown", "cooked", "boiling", "soft", "soften", "aromatic", "fragrant", "smooth"];
        const isStateMatch = stateDurations.some(s => lowerVal === s || lowerVal.startsWith(s + "-") || lowerVal.startsWith(s + " "));

        if (isStateMatch && !lowerVal.startsWith("until-")) {
          val = "until-" + lowerVal;
          lowerVal = val.toLowerCase();
        } else if (lowerVal === "overnight") {
          val = "for-overnight";
          lowerVal = val.toLowerCase();
        } else if (component.durationNumber && !lowerVal.startsWith("for-")) {
          // Add for- to numeric durations
          val = "for-" + val;
          lowerVal = val.toLowerCase();
        }

        let relation = "k7t";
        if (["immediately", "eventually", "as-per-needed"].includes(lowerVal)) relation = "krvn";
        else if (["soon", "always", "never", "sometimes", "often", "rarely", "frequently"].includes(lowerVal)) relation = "freq";
        else if (component.durationNumber) relation = "dur";

        const nextComp = currentInstruction[i + 1];
        if (nextComp && nextComp.type === "relation") {
          relation = nextComp.value;
          i++;
        }

        instruction.temporals.push({
          value: val,
          unit: component.durationUnit || "",
          display: component.value,
          relation: relation,
          semanticCategory: component.semanticCategory || "",
          morphoSemantic: component.morphoSemantic || "",
          actionIndex: currentActionIndex,
        });
      } else if (component.type === "tool") {
        instruction.tools.push({
          tool: component.value,
          relation: component.relation || "",
          relationType: "Tool",
          actionIndex: currentActionIndex,
        });
      }
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
        .map(t => (t.relation ? `(${t.relation}: ${t.tool})` : t.tool))
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

    // 🔄 5) Reload steps list — now it will contain the updated sentence
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

        await sendUSRToExternalService(cleanedUsr, data.graph_id, data.usr_id);
      } else {
        console.error("Graph creation failed:", data.message);
        alert("Graph creation failed: " + data.message);
      }
    } catch (err) {
      console.error("Error creating graph:", err);
      alert("Error creating graph. Check console for details.");
    }
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
  const sendUSRToExternalService = async (usrText, graphId, usrId) => {
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
  const addNewIngredient = async (name, emoji) => {
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
          type: "ingredient",
          name: englishName,
          emoji,
          original: name,
          lang: uiLang,
        }),
      });

      const data = await response.json();
      if (response.ok && data.message) {
        // Prevent duplicates locally
        if (ingredients.some((it) => it.name.toLowerCase() === englishName.toLowerCase())) {
          setShowIngredientForm(false);
          alert("This ingredient is already present in existing ones");
          return;
        }

        // Add new ingredient directly to local state so it appears immediately
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

  const handlePastSentenceClick = async (sentenceId) => {
    if (!sentenceId) return;
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

  // ==== RENDER ====
  return (
    <div className="recipe-page">
      <div className="recipe-card">
        {/* PROMINENT DESIGNER HEADER */}
        <header className="recipe-header-prominent" style={{
          background: "#f0fdfa",
          padding: "16px 24px",
          borderBottom: "1px solid #ccfbf1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
          marginBottom: "10px"
        }}>
          <div className="title-section">
            <h1 style={{
              fontSize: "2rem",
              fontWeight: "800",
              color: "#065f46",
              margin: 0,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.02em"
            }}>
              {recipeName || "noodles"}
            </h1>
            <div className="type-badge" style={{
              marginTop: "4px",
              fontSize: "0.85rem",
              color: "#10b981",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span><span style={{ color: "#065f46" }}>Type:</span> {recipeType || "Breakfast"}</span>
              <span><span style={{ color: "#065f46" }}>Duration:</span> {recipeDuration || "N/A"} mins</span>
            </div>
          </div>

          <div className="header-actions" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              onClick={() => navigate("/page1")}
              className="back-link-btn"
              type="button"
              style={{
                padding: "4px 12px",
                fontSize: "0.75rem",
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              ← {t("goBack")}
            </button>
            <button
              className="back-link-btn"
              type="button"
              onClick={() => setShowHowToUse(true)}
              style={{
                padding: "4px 12px",
                fontSize: "0.75rem",
                background: "#3b82f6",
                color: "white",
                borderRadius: "4px",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              📖 How to Use
            </button>
          </div>
        </header>

        {/* MAIN STACKED WORKSPACE */}
        <div className="workspace-stack">
          {/* 1. HORIZONTAL PALETTE */}
          <div className="horizontal-palette">
            <div className="palette-row">
              {/* 1. Actions */}
              <div className="component-section">
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
                      </div>
                    ))}
                  <div className="entity-card add-card" onClick={() => setShowActionForm(true)}>
                    <span className="entity-emoji">➕</span>
                    <span className="entity-name">Add</span>
                  </div>
                </div>
              </div>

              {/* 2. Ingredients */}
              <div className="component-section">
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
                      </div>
                    ))}
                  <div className="entity-card add-card" onClick={() => setShowIngredientForm(true)}>
                    <span className="entity-emoji">➕</span>
                    <span className="entity-name">Add</span>
                  </div>
                </div>
              </div>

              {/* 3. Descriptors */}
              <div className="component-section">
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
                      </div>
                    ))}
                  <div className="entity-card add-card" onClick={() => setShowDescriptorForm(true)}>
                    <span className="entity-emoji">➕</span>
                    <span className="entity-name">Add</span>
                  </div>
                </div>
              </div>

              {/* 4. Tools */}
              <div className="component-section">
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
                      </div>
                    ))}
                  <div className="entity-card add-card" onClick={() => setShowToolForm(true)}>
                    <span className="entity-emoji">➕</span>
                    <span className="entity-name">Add</span>
                  </div>
                </div>
              </div>

              {/* 5. Temporal */}
              <div className="component-section">
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
                <div className="entity-grid" style={{ height: "220px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
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

              {/* 6. Recipe Names */}
              <div className="component-section">
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
                <div className="entity-grid" style={{ height: "220px" }}>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, "ingredient", recipeName, "🍲")}
                    className="entity-card current-recipe-card"
                    onClick={() => toggleItemSelection("ingredient", recipeName, "🍲")}
                  >
                    <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>🍲</span>
                    <span className="entity-name">{recipeName}</span>
                  </div>
                  {userRecipes
                    .filter(r => r.recipe_name.toLowerCase().includes(recipesSearch.toLowerCase()))
                    .map((r, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, "ingredient", r.recipe_name, "📙")}
                        className="entity-card"
                        onClick={() => toggleItemSelection("ingredient", r.recipe_name, "📙")}
                      >
                        <span className="entity-emoji" style={{ fontSize: "0.8rem" }}>📙</span>
                        <span className="entity-name">{r.recipe_name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>


          {/* 2. DROP ZONE (Full Width) */}
          <section className="builder-panel panel">
            <div className="panel-header" style={{ padding: "4px 10px" }}>
              <div className="panel-title" style={{ fontSize: "0.65rem", fontWeight: "500" }}>🛠️ {t("instructionBuilderTitle")}</div>
            </div>
            <div className="panel-scroll" style={{ padding: "6px" }}>
              <div
                className={`drop-zone ${dragOver ? "drag-over" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ padding: "8px", minHeight: "60px", borderRadius: "12px" }}
              >
                <div className="instruction-builder" style={{ gap: "6px", minHeight: "40px" }}>
                  {currentInstruction.length === 0 ? (
                    <div className="placeholder-text" style={{ fontSize: "0.6rem", padding: "8px", textAlign: "center", width: "100%" }}>
                      {t("placeholderText")}
                    </div>
                  ) : (
                    currentInstruction.map((comp, idx) => (
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
                    ))
                  )}
                </div>
              </div>
              <div className="builder-toolbar" style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", gap: "10px" }}>
                <button className="clear-btn" onClick={clearInstruction} style={{ fontSize: "0.6rem", padding: "2px 8px" }}>{t("clearAll")}</button>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(pastInstructions.length > 0 || englishSentences.length > 0) && (
                    <button
                      className="generate-btn"
                      onClick={handleAddNewInstruction}
                      style={{ padding: "4px 12px", fontSize: "0.65rem", borderRadius: "8px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
                    >
                      ➕ {t("addNewInstruction")}
                    </button>
                  )}
                  <button className="generate-btn" onClick={generateInstruction} disabled={!canGenerate()} style={{ padding: "4px 12px", fontSize: "0.65rem", borderRadius: "8px" }}>
                    ✨ {t("generateInstruction")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. SPLIT RESULT AREA (3 boxes) */}
          <div className="split-result-area">
            {/* Box 1: USR Table */}
            <section className="panel">
              <div className="panel-header" style={{ padding: "4px 10px" }}><div className="panel-title" style={{ fontSize: "0.65rem", fontWeight: "500" }}>📋 {t("generatedUSR")}</div></div>
              <div className="panel-scroll" style={{ padding: "0", height: "300px", overflowY: "auto" }}>
                {usrTableHtml ? (
                  <div className="compact-usr" style={{ fontSize: "0.6rem" }} dangerouslySetInnerHTML={{ __html: usrTableHtml }} />
                ) : (
                  <div style={{ fontSize: "0.6rem", color: "#94a3b8", padding: "40px", textAlign: "center" }}>USR Table will appear here</div>
                )}
              </div>
            </section>

            {/* Box 2: Graph */}
            <section className="panel">
              <div className="panel-header" style={{ padding: "4px 10px" }}><div className="panel-title" style={{ fontSize: "0.65rem", fontWeight: "500" }}>📊 {t("generatedGraph")}</div></div>
              <div className="panel-scroll" style={{ padding: "6px", textAlign: "center" }}>
                {graphImage ? (
                  <img src={graphImage} alt="Graph" style={{ width: "100%", borderRadius: "4px", cursor: "pointer" }} onClick={() => setShowGraphModal(true)} />
                ) : (
                  <div style={{ fontSize: "0.6rem", color: "#94a3b8", padding: "40px 0" }}>Graph will appear here</div>
                )}
              </div>
            </section>

            {/* Box 3: History & Sentences */}
            <section className="panel">
              <div className="panel-header" style={{ padding: "4px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="panel-title" style={{ fontSize: "0.65rem", fontWeight: "500" }}>📜 {t("stepsForRecipe")}</div>
                {englishSentences.length > 0 && (
                  <button className="generate-btn" onClick={handleAddNewInstruction} style={{ padding: "2px 6px", fontSize: "0.6rem", background: "#22c55e", borderRadius: "4px" }}>
                    ➕ {t("addNewInstruction")}
                  </button>
                )}
              </div>
              <div className="panel-scroll" style={{ padding: "6px", height: "300px", overflowY: "auto" }}>
                {/* Generated Sentences */}
                {englishSentences.length > 0 && (
                  <div className="panel-card" style={{ marginBottom: "8px", padding: "6px", background: "#f0fdf4", border: "1px solid #dcfce7" }}>
                    <div style={{ fontSize: "0.62rem", color: "#166534", marginBottom: "4px" }}>Current Result:</div>
                    <ul style={{ paddingLeft: "12px", margin: 0 }}>
                      {englishSentences.map((s, idx) => (
                        <li key={idx} style={{ fontSize: "0.62rem", marginBottom: "2px", cursor: "pointer" }} onClick={() => handlePastSentenceClick(selectedSentenceId)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{s}</span>
                            <button onClick={() => removeSentence(s)} style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", padding: "0 4px" }}>×</button>
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
                        style={{ padding: "4px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
                        onClick={() => handlePastSentenceClick(inst.sentence_id)}
                      >
                        <span style={{ fontSize: "0.62rem", flex: 1 }}><strong>#{index + 1}:</strong> {inst.text}</span>
                        <button onClick={(e) => { e.stopPropagation(); removeGeneratedStep(index); }} style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.7rem", padding: "0 4px" }}>×</button>
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
        </div>

        {/* Loader */}
        {loading && (
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
        )}

        {/* Submit Modal */}
        {showModal && (
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
        )}

        {/* Graph Zoom Modal */}
        {showGraphModal && graphImage && (
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
        )}

        {/* POPUPS */}
        {showSemanticPopup && (
          <SemanticPopup
            onConfirm={confirmSemanticCategory}
            onSkip={skipSemanticCategory}
            onCancel={() => setShowSemanticPopup(false)}
            semanticOptions={semanticOptions}
            morphoOptions={morphoOptions}
          />
        )}

        {showTemporalSemanticPopup && (
          <SemanticPopup
            onConfirm={confirmTemporalSemanticCategory}
            onSkip={skipTemporalSemanticCategory}
            onCancel={() => setShowTemporalSemanticPopup(false)}
            semanticOptions={semanticOptions}
            morphoOptions={morphoOptions}
          />
        )}

        {showTAMSelector && (
          <TAMSelector
            tams={tams}
            onConfirm={confirmTAM}
            onCancel={() => setShowTAMSelector(false)}
          />
        )}

        {showDurationPopup && (
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
        )}



        {showRelationPrompt && (
          <RelationPrompt
            onConfirm={confirmRelation}
            onSkip={() => setShowRelationPrompt(false)}
            type={currentInstruction[currentInstruction.length - 1]?.type}
            currentItem={currentInstruction[currentInstruction.length - 1]}
          />
        )}

        {showIngredientForm && (
          <AddItemForm
            title="Add New Ingredient"
            onAdd={addNewIngredient}
            onCancel={() => setShowIngredientForm(false)}
          />
        )}

        {showActionForm && (
          <AddItemForm
            title="Add New Action"
            onAdd={addNewAction}
            onCancel={() => setShowActionForm(false)}
          />
        )}

        {showDescriptorForm && (
          <AddItemForm
            title="Add New Descriptor"
            onAdd={addNewDescriptor}
            onCancel={() => setShowDescriptorForm(false)}
          />
        )}

        {showToolForm && (
          <AddItemForm
            title="Add New Tool"
            onAdd={addNewTool}
            onCancel={() => setShowToolForm(false)}
          />
        )}

        {showTemporalForm && (
          <AddItemForm
            title="Add New Temporal Item"
            onAdd={addNewTemporal}
            onCancel={() => setShowTemporalForm(false)}
          />
        )}

        {showHowToUse && (
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
                  <li><strong>Add New:</strong> Click "Add New Sentence" to start the next step.</li>
                  <li><strong>Combine Steps:</strong> Once you have at least <strong>two steps</strong>, click "Next: Sentence Relations" to combine them into a story.</li>
                </ol>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setShowHowToUse(false)}>Got it!</button>
              </div>
            </div>
          </div>
        )}

        {showConnectionPrompt && (
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
                    setPendingIngredient(pendingIngredientForConnection);
                    setShowConnectionPrompt(false);

                    // Handle relation logic for second-time ingredient selections: 
                    // Reuse the previous relation if available
                    const lastRel = [...currentInstruction].reverse().find(c => c.type === "relation");
                    if (lastRel) {
                      setInherentRelation(lastRel.value);
                    }

                    setShowSemanticPopup(true);
                    setPendingIngredientForConnection(null);
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
                    setPendingIngredient(pendingIngredientForConnection);
                    setShowConnectionPrompt(false);

                    // Reuse previous relation
                    const lastRel = [...currentInstruction].reverse().find(c => c.type === "relation");
                    if (lastRel) {
                      setInherentRelation(lastRel.value);
                    }

                    setShowSemanticPopup(true);
                    setPendingIngredientForConnection(null);
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
        )}
      </div>
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
      <div className="semantic-popup">
        <h5 style={{ marginBottom: "16px" }}>
          Select Semantic &amp; Morpho-Semantic
        </h5>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label>
              <strong>Semantic Category</strong>
            </label>
            <select
              id="semanticCategorySelect"
              className="form-control"
              value={semantic}
              onChange={(e) => setSemantic(e.target.value)}
            >
              {semanticOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>
              <strong>Morpho-Semantic</strong>
            </label>
            <select
              id="morphoSemanticSelect"
              className="form-control"
              value={morpho}
              onChange={(e) => setMorpho(e.target.value)}
            >
              {morphoOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}
          >
            <button className="btn btn-primary" onClick={handleConfirm}>
              ✅ Confirm
            </button>
            <button className="btn btn-secondary" onClick={onCancel}>
              ❌ Cancel
            </button>
          </div>
          <button className="btn btn-warning" onClick={onSkip}>
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


const RelationPrompt = ({ onConfirm, onSkip, type, currentItem }) => {
  const temporalRelations = [
    "When(time)-कितनी देर तक- अधिकरण/काल",
    "When(time)-कितने देर में- अधिकरण/काल",
    "When(time)-कब तक- अधिकरण/काल",
    "When(time)-कितनी  समय तक- अधिकरण/काल",
  ];

  const generalRelations = [
    "What (subject) - क्या-कर्ता",
    "What (object) - क्या-कर्म",
    "How - कैसे",
    "Whom (recipient) - किसके लिए-सम्प्रदान",
    "From where (source) - कहाँ से-अपादान",
    "Where (place) - कहाँ-अधिकरण/देश",
    "In - किस में",
    "Why (reason) - किस के कारण",
    "Like what - किस के समान",
    "With what - किस के साथ",
    "Compared to what - किसके तुलना में",
    "Modifier - विशेषण/क्रिया विशेषण",
    "Quantity - मात्रा",
  ];

  const relationOptions = (type === "temporal" || type === "descriptor") ? temporalRelations : generalRelations;

  const [relation, setRelation] = React.useState(relationOptions[0]);

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