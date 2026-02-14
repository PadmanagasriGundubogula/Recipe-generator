import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import "./sentence-relations.css";
import { translateText } from "./translate";
import { API_URL } from "./config";

const RELATIONS = [
  "and",
  "or",
  "but",
  "also",
  "as well as",
  "besides",
  "in addition",
  "along with",
  "furthermore",
  "moreover",
  "likewise",
  "similarly",
  "In the same way",
  "either...or",
  "rather",
  "alternatively",
  "yet",
  "still",
  "nevertheless",
  "nonetheless",
  "though",
  "although",
  "even though",
  "despite",
  "whereas",
  "while",
  "in spite of",
  "on the contrary",
  "instead",
  "however",
  "in other words",
  "if",
  "if then",
  "even if",
  "unless",
  "otherwise",
  "after",
  "before",
  "then",
  "Subsequently",
  "meanwhile",
  "Since",
  "As",
  "Given that",
  "because",
  "because of",
  "due to",
  "so",
  "Therefore",
  "hence",
  "as a result",
  "thus",
  "that's why",
  "not only..but also",
  "for instance",
  "for example"
];

export default function SentenceRelations() {
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [showReorderView, setShowReorderView] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [relation, setRelation] = useState("and");
  const [combinedSentences, setCombinedSentences] = useState([]);
  const [combinedResult, setCombinedResult] = useState("—");
  const [finalSteps, setFinalSteps] = useState([]);
  const [finalStructure, setFinalStructure] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [generatedHindiText, setGeneratedHindiText] = useState("");
  const [recipeInfo, setRecipeInfo] = useState({ name: "", type: "", time: "", created_at: "" });
  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [inspectData, setInspectData] = useState(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const normalizeSentence = (s) => {
    if (!s) return "";
    let out = s.trim();
    if (out.endsWith(".")) out = out.slice(0, -1);
    return out;
  };

  const lowerFirst = (s) => {
    if (!s) return "";
    return s.charAt(0).toLowerCase() + s.slice(1);
  };

  const upperFirst = (s) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  useEffect(() => {
    const loadInstructions = async () => {
      try {
        const recipeId = localStorage.getItem("currentRecipeId");
        const appLang = localStorage.getItem("app_language") || "en";

        if (!recipeId) {
          setError("No recipe selected. Please go back and create a recipe first.");
          setLoading(false);
          return;
        }

        // Fetch recipe details to get the name
        let currentRecipeName = "dish";
        try {
          const recipeRes = await fetch(`${API_URL}/get-recipe/${recipeId}`);
          const recipeData = await recipeRes.json();
          if (recipeRes.ok) {
            const name = recipeData.recipe_name || "dish";
            setRecipeInfo({
              name: name,
              type: recipeData.recipe_type || "N/A",
              time: recipeData.cooking_time || "N/A",
              created_at: recipeData.created_at
            });
            currentRecipeName = name;
          }
        } catch (e) {
          console.error("Error fetching recipe name:", e);
        }

        const res = await fetch(`${API_URL}/get-sentences-with-id/${recipeId}`);
        const data = await res.json();

        let rawList = [];

        if (Array.isArray(data.sentences)) {
          rawList = data.sentences;
        } else if (Array.isArray(data.instructions)) {
          rawList = data.instructions.map((i) => ({
            text: i.text || "",
            sentence_id: i.sentence_id || "",
            step_number: i.step_number || null,
          }));
        }

        let list = rawList.map((item, index) => {
          if (typeof item === "string") {
            return {
              text: item,
              sentence_id: `sent_${index}`,
            };
          }
          return {
            text: item.text || "",
            sentence_id: item.sentence_id || `sent_${index}`,
          };
        });

        // Add Generic Line
        const genericLines = [
          `That’s it—your ${currentRecipeName} is ready to enjoy!`,
          "Time to eat! Serve and enjoy.",
          "Serve as desired once preparation is complete.",
          "Once cooking is complete, serve as desired.",
          "Your dish is now ready—serve and enjoy as desired.",
          "The recipe is complete; serve as preferred and enjoy."
        ];
        const randomGeneric = genericLines[Math.floor(Math.random() * genericLines.length)];

        // Add as a pseudo-sentence
        list.push({
          text: randomGeneric,
          sentence_id: `generic_${Date.now()}`,
          isGeneric: true
        });

        if (appLang !== "en" && list.length > 0) {
          const translated = await Promise.all(
            list.map((obj) =>
              translateText(obj.text, appLang, "en").then((t) => ({
                ...obj,
                text: t,
              }))
            )
          );
          setInstructions(translated);
        } else {
          setInstructions(list);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading instructions:", err);
        setError("Failed to load instructions from server.");
        setLoading(false);
      }
    };

    loadInstructions();
  }, []);

  const allSteps = [
    ...instructions.map(inst => ({
      text: inst.text,
      sentence_id: inst.sentence_id,
      isCombined: false
    })),
    ...combinedSentences.map(c => ({
      text: c.text,
      sentence_ids: c.sentence_ids,
      isCombined: true
    }))
  ];

  const toggleSelect = (index) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) {
        alert("You can only select two sentences.");
        return prev;
      }
      return [...prev, index];
    });
  };

  const buildCombinedSentence = (s1Raw, s2Raw, relation) => {
    let s1 = normalizeSentence(s1Raw);
    let s2 = normalizeSentence(s2Raw);

    if (!s1 || !s2) return "";

    switch (relation) {
      case "then":
        return upperFirst(`${s1}, then ${lowerFirst(s2)}.`);
      case "and":
        return upperFirst(`${s1} and ${lowerFirst(s2)}.`);
      case "or":
        return upperFirst(`${s1} or ${lowerFirst(s2)}.`);
      case "but":
        return upperFirst(`${s1}, but ${lowerFirst(s2)}.`);
      case "as well as":
        return upperFirst(`${s1}, as well as ${lowerFirst(s2)}.`);
      case "besides":
        return upperFirst(`${s1}; besides, ${lowerFirst(s2)}.`);
      case "in addition":
        return upperFirst(`${s1}; in addition, ${lowerFirst(s2)}.`);
      case "along with":
        return upperFirst(`${s1}, along with ${lowerFirst(s2)}.`);
      case "if then":
        return upperFirst(`If ${lowerFirst(s1)}, then ${lowerFirst(s2)}.`);
      case "if":
        return upperFirst(`If ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "otherwise":
        return upperFirst(`${s1}. Otherwise, ${lowerFirst(s2)}.`);
      case "after":
        return upperFirst(`After ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "before":
        return upperFirst(`Before ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "because":
        return upperFirst(`${s1} because ${lowerFirst(s2)}.`);
      case "because of":
        return upperFirst(`${s2} because of ${lowerFirst(s1)}.`);
      case "due to":
        return upperFirst(`${s2} due to ${lowerFirst(s1)}.`);
      case "thus":
        return upperFirst(`${s1}. Thus, ${lowerFirst(s2)}.`);
      case "that's why":
        return upperFirst(`${s1}. That is why ${lowerFirst(s2)}.`);
      case "as a result":
        return upperFirst(`${s1}. As a result, ${lowerFirst(s2)}.`);
      case "although":
        return upperFirst(`Although ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "even though":
        return upperFirst(`Even though ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "despite":
        return upperFirst(`Despite ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "not only..but also":
        return upperFirst(`Not only ${lowerFirst(s1)}, but also ${lowerFirst(s2)}.`);
      case "however":
        return upperFirst(`${s1}. However, ${lowerFirst(s2)}.`);
      case "in other words":
        return upperFirst(`${s1}. In other words, ${lowerFirst(s2)}.`);
      case "for example":
        return upperFirst(`${s1}. For example, ${lowerFirst(s2)}.`);

      // Keeping existing others that weren't explicitly redefined but are in the RELATIONS list
      case "also":
        return upperFirst(`${s1}. Also, ${lowerFirst(s2)}.`);
      case "furthermore":
        return upperFirst(`${s1}. Furthermore, ${lowerFirst(s2)}.`);
      case "moreover":
        return upperFirst(`${s1}. Moreover, ${lowerFirst(s2)}.`);
      case "likewise":
        return upperFirst(`${s1}. Likewise, ${lowerFirst(s2)}.`);
      case "similarly":
        return upperFirst(`${s1}. Similarly, ${lowerFirst(s2)}.`);
      case "In the same way":
        return upperFirst(`${s1}. In the same way, ${lowerFirst(s2)}.`);
      case "either...or":
        return upperFirst(`Either ${lowerFirst(s1)} or ${lowerFirst(s2)}.`);
      case "rather":
        return upperFirst(`${s1}. Rather, ${lowerFirst(s2)}.`);
      case "alternatively":
        return upperFirst(`${s1}. Alternatively, ${lowerFirst(s2)}.`);
      case "yet":
        return upperFirst(`${s1}, yet ${lowerFirst(s2)}.`);
      case "still":
        return upperFirst(`${s1}. Still, ${lowerFirst(s2)}.`);
      case "nevertheless":
        return upperFirst(`${s1}. Nevertheless, ${lowerFirst(s2)}.`);
      case "nonetheless":
        return upperFirst(`${s1}. Nonetheless, ${lowerFirst(s2)}.`);
      case "though":
        return upperFirst(`Though ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "whereas":
        return upperFirst(`Whereas ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "while":
        return upperFirst(`${s1}, while ${lowerFirst(s2)}.`);
      case "in spite of":
        return upperFirst(`In spite of ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "on the contrary":
        return upperFirst(`${s1}. On the contrary, ${lowerFirst(s2)}.`);
      case "instead":
        return upperFirst(`${s1}. Instead, ${lowerFirst(s2)}.`);
      case "Since":
        return upperFirst(`Since ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "As":
        return upperFirst(`As ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "Given that":
        return upperFirst(`Given that ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "so":
        return upperFirst(`${s1}, so ${lowerFirst(s2)}.`);
      case "Therefore":
        return upperFirst(`${s1}, therefore ${lowerFirst(s2)}.`);
      case "hence":
        return upperFirst(`${s1}, hence ${lowerFirst(s2)}.`);
      case "meanwhile":
        return upperFirst(`${s1}, meanwhile ${lowerFirst(s2)}.`);
      case "Subsequently":
        return upperFirst(`${s1}, subsequently ${lowerFirst(s2)}.`);
      case "unless":
        return upperFirst(`${s1}, unless ${lowerFirst(s2)}.`);
      case "even if":
        return upperFirst(`Even if ${lowerFirst(s1)}, ${lowerFirst(s2)}.`);
      case "for instance":
        return upperFirst(`${s1}. For instance, ${lowerFirst(s2)}.`);
      default:
        // Default to a simple space join if relation name isn't matched perfectly
        return upperFirst(`${s1} ${relation} ${lowerFirst(s2)}.`);
    }
  };

  const handleCombine = () => {
    if (selectedIndices.length !== 2) {
      alert("Select exactly two sentences.");
      return;
    }

    const step1 = allSteps[selectedIndices[0]];
    const step2 = allSteps[selectedIndices[1]];

    const ids1 = step1.isCombined ? step1.sentence_ids : [step1.sentence_id];
    const ids2 = step2.isCombined ? step2.sentence_ids : [step2.sentence_id];

    const isSameGroup = combinedSentences.some(c =>
      ids1.every(id => c.sentence_ids.includes(id)) &&
      ids2.every(id => c.sentence_ids.includes(id))
    );

    if (isSameGroup) {
      alert("These sentences are already combined together.");
      return;
    }

    fetch(`${API_URL}/add-discourse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sentence1_id: ids1[0],
        sentence2_id: ids2[0],
        relation
      })
    })
      .then(res => res.json())
      .then(data => console.log("Discourse update response:", data))
      .catch(err => console.error("Error sending discourse:", err));

    const result = buildCombinedSentence(step1.text, step2.text, relation);
    if (!result) {
      alert("Could not combine sentences.");
      return;
    }

    setCombinedResult(result);
    setCombinedSentences(prev => [
      ...prev,
      { text: result, sentence_ids: [...ids1, ...ids2] }
    ]);

    setSelectedIndices([]);
  };

  const handleRemoveCombined = (idx) => {
    const removed = combinedSentences[idx];

    fetch(`${API_URL}/remove-discourse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sentence_ids: removed.sentence_ids
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log("Discourse removed:", data);
      })
      .catch(err => {
        console.error("Failed to remove discourse:", err);
      });

    setCombinedSentences(prev => prev.filter((_, i) => i !== idx));
    setFinalSteps(prev => prev.filter(step => step !== removed.text));
    setFinalStructure(prev =>
      prev.filter(
        s => JSON.stringify(s) !== JSON.stringify(removed.sentence_ids)
      )
    );

    setSelectedIndices([]);
  };

  const handleSaveAll = () => {
    if (combinedSentences.length === 0) {
      alert("No combined sentences to save.");
      return;
    }
    console.log("Saving combined sentences:", combinedSentences);
    alert("Combined sentences saved (console.log for now).");
  };
  const handleAddToFinal = (step) => {
    setFinalSteps(prev => [...prev, step.text]);
    if (step.isCombined) {
      setFinalStructure(prev => [...prev, step.sentence_ids]);
    } else {
      setFinalStructure(prev => [...prev, step.sentence_id]);
    }
  };

  const handleGenerateRunningText = async () => {
    try {
      setGenerating(true);
      setGeneratedText("");

      const recipeId = localStorage.getItem("currentRecipeId");
      const uiLanguage = localStorage.getItem("app_language") || "english";

      // Filter out generic sentences from finalStructure
      // Generic sentences should not be sent to backend for generation
      const nonGenericStructure = finalStructure.filter((item, index) => {
        const step = finalSteps[index];
        // Check if this step contains generic text
        const isGeneric = step && (
          step.includes("ready to enjoy") ||
          step.includes("Time to eat") ||
          step.includes("Serve and enjoy") ||
          step.includes("recipe is complete") ||
          step.toLowerCase().includes("serve as desired")
        );
        return !isGeneric;
      });

      // Find the generic line if it exists
      const genericLine = finalSteps.find(step =>
        step && (
          step.includes("ready to enjoy") ||
          step.includes("Time to eat") ||
          step.includes("Serve and enjoy") ||
          step.includes("recipe is complete") ||
          step.toLowerCase().includes("serve as desired")
        )
      );

      const payload = {
        recipe_id: recipeId,
        sentence_order: nonGenericStructure,  // Send only non-generic sentences
        ui_language: uiLanguage
      };

      console.log("Sending to backend:", payload);

      const res = await fetch(`${API_URL}/generate-running-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("Running text response:", data);

      let generatedParagraph = "";
      if (data.status === "success" && data.generated_text) {
        generatedParagraph = data.generated_text;
      } else if (data.generator_response?.paragraph_wrapped) {
        generatedParagraph = data.generator_response.paragraph_wrapped;
      } else if (data.generator_response?.paragraph) {
        generatedParagraph = data.generator_response.paragraph;
      }

      // Append generic line at the end if it exists
      if (generatedParagraph && genericLine) {
        generatedParagraph = generatedParagraph.trim() + " " + genericLine;
      }

      setGeneratedText(generatedParagraph);
      if (generatedParagraph) {
        alert("Running text generated successfully!");
      } else {
        alert("Text generated but format unexpected. Check console.");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      alert("Failed to generate running text: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const recipeId = localStorage.getItem("currentRecipeId");
      if (!recipeId) return;

      const recipeResp = await fetch(`${API_URL}/get-recipe/${recipeId}`);
      const recipeData = await recipeResp.json();

      const ingredients = Array.isArray(recipeData.ingredients) ? recipeData.ingredients.join(", ") : "N/A";
      const stepsText = finalSteps.map((s, idx) => `${idx + 1}. ${s}`).join("\n");

      let content = `RECIPE DETAILS\n` +
        `====================\n` +
        `Name: ${recipeInfo.name}\n` +
        `Type: ${recipeInfo.type}\n` +
        `duration to cook : ${recipeInfo.time}minutes\n` +
        `Created At: ${recipeInfo.created_at ? new Date(recipeInfo.created_at).toLocaleString() : new Date().toLocaleString()}\n` +
        `INGREDIENTS:\n` +
        `${ingredients}\n\n` +
        `STEPS:\n` +
        `${stepsText}\n\n` +
        `Generated with Recipe Generator 🍴\n`;

      if (generatedText) {
        content += `\n${generatedText}\n`;
      }
      if (generatedHindiText) {
        content += `\n${generatedHindiText}\n`;
      }

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${recipeInfo.name.replace(/\s+/g, "_")}_recipe.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download recipe.");
    }
  };

  // Effect to trigger translation after generatedText updates
  useEffect(() => {
    const translateOutput = async () => {
      if (generatedText && !generatedHindiText) {
        setTranslating(true);
        try {
          // 🔥 Remove generic line from text before translating to Hindi
          // Generic line should ONLY appear in English, not in Hindi
          let textToTranslate = generatedText;

          // Check if text contains a generic closing line
          const genericPatterns = [
            /That's it[^.]*ready to enjoy!/i,
            /Time to eat.*Serve and enjoy\./i,
            /Serve as desired.*complete\./i,
            /cooking is complete.*serve as desired\./i,
            /dish is now ready.*enjoy as desired\./i,
            /recipe is complete.*enjoy\./i
          ];

          // Remove generic line if found
          for (const pattern of genericPatterns) {
            if (pattern.test(textToTranslate)) {
              textToTranslate = textToTranslate.replace(pattern, '').trim();
              break;
            }
          }

          // Translate only the non-generic part to Hindi
          const hi = await translateText(textToTranslate, "hi", "en");
          setGeneratedHindiText(hi);
        } catch (e) {
          console.error("Auto-translate error:", e);
        } finally {
          setTranslating(false);
        }
      }
    };
    translateOutput();
  }, [generatedText, generatedHindiText]);

  const handleRemoveFromFinal = (index) => {
    setFinalSteps(prev => prev.filter((_, i) => i !== index));
    setFinalStructure(prev => prev.filter((_, i) => i !== index));
  };

  const handleReorder = (currentIndex, newValue) => {
    if (newValue === "") return; // Let user clear input
    let newIndex = parseInt(newValue, 10);
    if (isNaN(newIndex)) return;

    newIndex = newIndex - 1;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= finalSteps.length) newIndex = finalSteps.length - 1;
    if (newIndex === currentIndex) return;

    setFinalSteps(prev => {
      const copy = [...prev];
      const [item] = copy.splice(currentIndex, 1);
      copy.splice(newIndex, 0, item);
      return copy;
    });

    setFinalStructure(prev => {
      const copy = [...prev];
      const [item] = copy.splice(currentIndex, 1);
      copy.splice(newIndex, 0, item);
      return copy;
    });

    setOrderChanged(true);
    setTimeout(() => {
      setOrderChanged(false);
    }, 2000);
  };

  const handleInspectSentence = async (sentenceId) => {
    if (!sentenceId) return;
    try {
      setLoadingInspect(true);
      const res = await fetch(`${API_URL}/get-instruction-details/${sentenceId}`);
      const data = await res.json();
      if (res.ok) {
        setInspectData(data);
      } else {
        alert("Failed to load details: " + data.error);
      }
    } catch (err) {
      console.error("Error inspecting sentence:", err);
    } finally {
      setLoadingInspect(false);
    }
  };

  const renderUSRTable = (usrText) => {
    if (!usrText) return "";
    const lines = usrText.split("\n");
    const headers = ["Node", "ID", "Semantic", "Morpho", "Relation", "Construction"];
    let html = `<table class="usr-table"><thead><tr>`;
    headers.forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("%")) return;
      const cols = trimmed.split(/\s+/);
      if (cols.length < 2) return;
      html += `<tr>${cols.slice(0, 6).map(c => `<td>${c}</td>`).join("")}</tr>`;
    });
    html += `</tbody></table>`;
    return html;
  };

  const finalText = finalSteps.join(" ");

  const handleCopyFinal = async () => {
    if (!finalText.trim()) {
      alert("No final text to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(finalText);
      alert("Final text copied to clipboard!");
    } catch {
      alert("Could not copy text. Please copy manually.");
    }
  };

  const selectedCount = selectedIndices.length;

  if (loading) {
    return (
      <div className="relations-page">
        <div className="relations-card">
          <main className="relations-main">
            <div className="loading-box">Loading…</div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relations-page">
        <div className="relations-card">
          <main className="relations-main">
            <button className="go-back-btn" onClick={() => window.history.back()}>
              ⬅ Go Back
            </button>
            <p style={{ color: "red" }}>{error}</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relations-page">
      <div className="relations-card">
        <main className="relations-main">
          <button className="go-back-btn" onClick={() => {
            if (window.confirm("⚠️ Warning: You can edit or create new instructions but you won't be able to create a new recipe. Continue?")) {
              navigate('/page2');
            }
          }}>
            ⬅ Back to Recipe Instructions
          </button>

          <div className="page-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1>Sentence Relations Builder</h1>

              <button
                className="secondary-btn"
                onClick={() => {
                  if (window.confirm("⚠️ Warning: You can edit or create new instructions but you won't be able to create a new recipe. Continue?")) {
                    navigate('/page2');
                  }
                }}
                style={{ background: "#e6e6e6", color: "#000", padding: "8px 12px", borderRadius: "8px" }}
                title="Back to recipe instructions"
              >
                ⬅ Back
              </button>

              <button
                className="primary-btn"
                onClick={() => setShowHowToUse(true)}
                style={{ background: "#4c6fff", color: "white", padding: "8px 16px", borderRadius: "8px" }}
              >
                📖 How to Use
              </button>
            </div>
            <p className="page-subtitle">
              Combine steps with logical relations and assemble a clean final
              recipe text.
            </p>
          </div>

          <div className="header-badges">
            <span className="badge badge-soft">
              🧩 Selected: {selectedCount}/2
            </span>
            <span className="badge badge-accent">
              Relation: <strong>{relation}</strong>
            </span>
          </div>

          <div className="relations-layout-2col">
            <div className="relations-left-panel">
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2>Available Steps</h2>
                  <span className="panel-meta">
                    {instructions.length} original · {combinedSentences.length} combined
                  </span>
                </div>
                <button
                  onClick={async () => {
                    if (allSteps.length === 0) {
                      alert("No steps available to download.");
                      return;
                    }

                    try {
                      const recipeId = localStorage.getItem("currentRecipeId");
                      const recipeResp = await fetch(`http://localhost:2000/get-recipe/${recipeId}`);
                      const recipeData = await recipeResp.json();

                      let content = `RECIPE: ${recipeInfo.name || "N/A"}\n`;
                      content += `TYPE: ${recipeInfo.type || "N/A"}\n`;
                      content += `TIME: ${recipeInfo.time || "N/A"} minutes\n`;
                      content += `\n${"-".repeat(50)}\n\n`;
                      content += `ALL AVAILABLE STEPS:\n\n`;

                      for (let i = 0; i < allSteps.length; i++) {
                        const step = allSteps[i];
                        content += `${i + 1}. ${step.text}\n`;

                        // Try to get USR for each step if it's an original sentence
                        if (!step.isCombined && step.sentence_id) {
                          try {
                            const res = await fetch(`${API_URL}/get-instruction-details/${step.sentence_id}`);
                            const data = await res.json();
                            if (res.ok && data.usr_text) {
                              content += `\nUSR:\n${data.usr_text}\n`;
                            }
                          } catch (err) {
                            console.error("Error fetching USR for step", i + 1);
                          }
                        }
                        content += `\n${"-".repeat(50)}\n\n`;
                      }

                      const blob = new Blob([content], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `${recipeInfo.name || "recipe"}_all_steps.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error("Download failed:", err);
                      alert("Failed to download all steps.");
                    }
                  }}
                  style={{ fontSize: "0.75rem", background: "#4c6fff", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}
                  title="Download all available steps with USR data"
                >
                  ⬇️ Download All
                </button>
              </div>

              <div className="sentence-list">
                {allSteps.length === 0 ? (
                  <p className="muted">No steps found from backend.</p>
                ) : (
                  <>
                    <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "10px", color: "#666" }}>
                      💡 Click the sentences to select them for combination. Combine two sentences with a relation.
                    </p>
                    <button
                      className="primary-btn"
                      onClick={() => {
                        // Clear current final steps first to avoid duplicates or just append? 
                        // Usually adding all means refreshing the final list.
                        setFinalSteps(allSteps.map(s => s.text));
                        setFinalStructure(allSteps.map(s => s.isCombined ? s.sentence_ids : s.sentence_id));
                        setShowReorderView(true);
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      style={{ marginBottom: "20px", width: "100%", background: "#4c6fff", color: "white" }}
                    >
                      📋 Select all to final text
                    </button>
                    {allSteps.map((s, i) => {
                      const isSelected = selectedIndices.includes(i);
                      const isOriginal = i < instructions.length;
                      const stepNumber = isOriginal
                        ? i + 1
                        : i - instructions.length + 1;

                      return (
                        <div
                          key={i}
                          className={
                            "sentence-box " +
                            (isSelected ? "selected " : "") +
                            (isOriginal ? "sentence-box-original" : "sentence-box-combined")
                          }
                          onClick={() => toggleSelect(i)}
                        >
                          <div className="sentence-index">{stepNumber}</div>
                          <div className="sentence-content">
                            <div className="sentence-header-row">
                              <div className="sentence-tags">
                                {isOriginal && (
                                  <button
                                    type="button"
                                    className="inspect-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInspectSentence(s.sentence_id);
                                    }}
                                    style={{ marginLeft: "4px", border: "none", background: "transparent", cursor: "pointer" }}
                                    title="Inspect USR & Graph"
                                  >
                                    🔍
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                className="chip-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToFinal(s);
                                }}
                                title="Add this step to the final recipe sentence list"
                              >
                                ➕ Add to Final Sentence
                              </button>
                            </div>
                            <p>{s.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            <div className="relations-right-panel">
              {!showReorderView ? (
                <>
                  <div className="panel-header">
                    <h2>Combination History</h2>
                    <span className="panel-meta">
                      {combinedSentences.length} combined steps
                    </span>
                  </div>

                  <div className="relation-select-block">
                    <div className="relation-select-header">
                      <h3>Choose Relation</h3>
                      <span className="muted-small">
                        Select any two steps on the left, then connect them with a relation.
                      </span>
                    </div>

                    <div className="selected-summary">
                      {selectedIndices.length === 0 && <span>No steps selected yet.</span>}
                      {selectedIndices.length === 1 && (
                        <span>
                          Selected: Step {selectedIndices[0] + 1}. Select one more step.
                        </span>
                      )}
                      {selectedIndices.length === 2 && (
                        <span>
                          Selected: Step {selectedIndices[0] + 1} and Step{" "}
                          {selectedIndices[1] + 1}.
                        </span>
                      )}
                    </div>

                    <div className="relation-input-row">
                      <label className="label-text">Relation type</label>
                      <select
                        value={relation}
                        onChange={(e) => setRelation(e.target.value)}
                        className="relation-select"
                      >
                        {RELATIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (instructions.length < 2) {
                              alert("⚠️ Please generate at least 2 sentences on Page 2 before adding discourse relations.");
                              return;
                            }
                            handleCombine();
                          }}
                          className="primary-btn"
                          disabled={selectedIndices.length !== 2}
                        >
                          🔗 Combine selected ({selectedIndices.length}/2)
                        </button>
                        <Info
                          size={20}
                          style={{ cursor: "help", color: "#4c6fff" }}
                          title="Select 2 sentences from the list above and choose a relation to combine them. You need at least 2 generated sentences to add discourse."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="combined-list">
                    {combinedSentences.length === 0 ? (
                      <p className="muted">No combinations yet.</p>
                    ) : (
                      combinedSentences.map((c, idx) => (
                        <div key={idx} className="combined-item">
                          <span className="combined-text">{c.text}</span>
                          <button
                            className="icon-btn danger"
                            title="Remove combined sentence"
                            onClick={() => handleRemoveCombined(idx)}
                          >
                            ❌
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    className="primary-btn go-reorder-btn"
                    onClick={() => setShowReorderView(true)}
                  >
                    ➡ Go to Reorder Sentences
                  </button>
                </>
              ) : (
                <>
                  <div className="panel-header panel-header-row">
                    <h2>Final Recipe Text</h2>
                    <button
                      type="button"
                      className="secondary-btn small-btn"
                      onClick={() => setShowReorderView(false)}
                    >
                      ⬅ Back to Combination History
                    </button>
                  </div>

                  {orderChanged && (
                    <div className="order-alert">
                      🔔 Sentence order changed
                    </div>
                  )}

                  <ul className="final-steps-list">
                    {finalSteps.map((step, index) => (
                      <li key={index} className="final-step-item reorder-item">
                        <span className="reorder-text">
                          {index + 1}. {step}
                        </span>
                        <div className="reorder-actions">
                          <input
                            type="number"
                            className="reorder-input"
                            value={index + 1}
                            onChange={(e) => handleReorder(index, e.target.value)}
                          />
                          <button
                            className="icon-btn danger"
                            title="Remove sentence"
                            onClick={() => handleRemoveFromFinal(index)}
                          >
                            ❌
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {showReorderView && (
            <section className="final-section">
              <div className="final-header">
                <div>
                  <h2>Final Recipe Text</h2>
                </div>
                <div className="final-actions">
                  <button
                    className="primary-btn"
                    onClick={handleGenerateRunningText}
                    disabled={finalStructure.length === 0 || generating}
                  >
                    {generating ? "⏳ Generating..." : "🧠 Generate Running Text"}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleDownload}
                    style={{ background: "#22c55e", color: "white" }}
                  >
                    📥 Download Recipe File
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleCopyFinal}
                  >
                    📋 Copy Final Text
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleSaveAll}
                  >
                    💾 Save Combined
                  </button>
                </div>
              </div>
              <div className="final-body">
                <div className="final-preview">
                  <h3 className="final-steps-title">Running Text Preview</h3>
                  <div className="final-preview-box">
                    {generating ? (
                      <p className="muted">⏳ Generating running text...</p>
                    ) : (generatedText || generatedHindiText) ? (
                      <div className="dual-preview" style={{ display: "flex", flexDirection: "row", gap: "20px", flexWrap: "wrap" }}>
                        {generatedText && (
                          <div className="en-preview" style={{ flex: 1, minWidth: "300px", padding: "15px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <h4 style={{ color: "#4c6fff", fontSize: "0.9rem", marginBottom: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>English</h4>
                            <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#1e293b" }}>
                              {generatedText}
                            </p>
                          </div>
                        )}
                        {translating ? (
                          <p className="muted" style={{ fontSize: "0.8rem", flex: 1 }}>⏳ Translating to Hindi...</p>
                        ) : generatedHindiText && (
                          <div className="hi-preview" style={{ flex: 1, minWidth: "300px", padding: "15px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #dcfce7" }}>
                            <h4 style={{ color: "#22c55e", fontSize: "0.9rem", marginBottom: "8px", borderBottom: "1px solid #dcfce7", paddingBottom: "5px" }}>Hindi (हिंदी)</h4>
                            <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.8", color: "#1e293b", fontSize: "1rem" }}>
                              {generatedHindiText}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="muted">
                        Click "Generate Running Text" to combine your selected steps into a clean paragraph.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {showHowToUse && (
        <div className="modal-overlay" onClick={() => setShowHowToUse(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "white", padding: "30px", borderRadius: "15px", maxWidth: "600px", position: "relative" }}>
            <button
              onClick={() => setShowHowToUse(false)}
              style={{ position: "absolute", top: "15px", right: "20px", fontSize: "1.5rem", border: "none", background: "none", cursor: "pointer" }}
            >
              &times;
            </button>
            <h2 style={{ marginBottom: "20px" }}>📖 How to Use Builder</h2>
            <ol style={{ textAlign: "left", lineHeight: "1.8" }}>
              <li><strong>Select Sentences:</strong> Click any two steps from the left panel to select them.</li>
              <li><strong>Choose Relation:</strong> Pick a logical relation (like "after", "then", "because") from the dropdown.</li>
              <li><strong>Combine:</strong> Click "Combine selected" to create a smooth, connected instruction.</li>
              <li><strong>Finalize:</strong> Add your original or combined results to the "Final Recipe Text".</li>
              <li><strong>Reorder:</strong> Use the reorder view to arrange the sequence and generate the final paragraph.</li>
              <li><strong>Inspect:</strong> Click the 🔍 icon on any step to see its USR and logic!</li>
            </ol>
          </div>
        </div>
      )}

      {inspectData && (
        <div className="modal-overlay" onClick={() => setInspectData(null)}>
          <div className="inspect-modal" onClick={(e) => e.stopPropagation()} style={{ background: "white", padding: "30px", borderRadius: "15px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button
              onClick={() => setInspectData(null)}
              style={{ position: "absolute", top: "15px", right: "20px", fontSize: "1.5rem", border: "none", background: "none", cursor: "pointer" }}
            >
              &times;
            </button>
            <h2 style={{ marginBottom: "20px" }}>🔍 Sentence Inspection</h2>
            <h4>Text: {inspectData.instruction_text}</h4>

            <div style={{ display: "flex", gap: "30px", marginTop: "20px", flexWrap: "wrap" }}>
              <div style={{ flex: "1", minWidth: "300px" }}>
                <h5>USR Table</h5>
                <div
                  dangerouslySetInnerHTML={{ __html: renderUSRTable(inspectData.usr_text) }}
                  className="usr-table-container"
                />
              </div>
              <div style={{ flex: "1", minWidth: "300px" }}>
                <h5>Generated Graph</h5>
                {inspectData.graph_image ? (
                  <img
                    src={inspectData.graph_image && (inspectData.graph_image.startsWith("data:") ? inspectData.graph_image : `data:image/png;base64,${inspectData.graph_image}`)}
                    alt="Graph"
                    style={{ width: "100%", borderRadius: "10px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                  />
                ) : (
                  <p className="muted">No graph image available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .usr-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 0.9rem;
        }
        .usr-table th, .usr-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .usr-table th {
          background-color: #f4f4f4;
        }
        .inspect-modal {
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
      `}} />
    </div>
  );
}
