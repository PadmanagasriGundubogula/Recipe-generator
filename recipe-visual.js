// public/recipe-visual.js

(function () {
  const API_BASE = window.API_BASE_URL || "http://localhost:2000";

  // Helpers
  function $(id) {
    return document.getElementById(id);
  }

  function showLoader(show) {
    const loader = $("loader");
    if (!loader) return;
    loader.style.display = show ? "flex" : "none";
  }

  function showError(msg) {
    console.error(msg);
    alert(msg);
  }

  // 🔹 Build instruction JSON from the drop zone
  function buildInstructionFromUI() {
    const instructionBuilder = $("instructionBuilder");
    if (!instructionBuilder) return null;

    // Example: gather all elements that your drag-drop puts inside the builder
    const tokens = Array.from(
      instructionBuilder.querySelectorAll("[data-type][data-value]")
    );

    const instruction = {
      verb: null,
      nounRelations: [],
      descriptors: [],
    };

    tokens.forEach((el) => {
      const type = el.getAttribute("data-type");
      const value = el.getAttribute("data-value");

      if (type === "action" && !instruction.verb) {
        instruction.verb = { action: value };
      } else if (type === "ingredient" || type === "other") {
        instruction.nounRelations.push({
          relation: "What(object)",
          noun: value,
        });
      } else if (type === "descriptor") {
        instruction.descriptors.push(value);
      }
      // extend for relation tokens etc if needed
    });

    return instruction;
  }

  // 🔹 Render USR text
  function renderUsr(usrText) {
    const container = $("usrTableContainer");
    if (!container) return;
    container.innerHTML = "";

    const pre = document.createElement("pre");
    pre.style.whiteSpace = "pre-wrap";
    pre.textContent = usrText || "";
    container.appendChild(pre);
  }

  // 🔹 Render English sentences list
  function renderEnglishSentences(sentences) {
    const list = $("instructionsList");
    const box = $("generatedInstructions");
    if (!list || !box) return;

    list.innerHTML = "";
    if (!sentences || !sentences.length) {
      box.style.display = "none";
      return;
    }

    sentences.forEach((s, idx) => {
      const p = document.createElement("p");
      p.textContent = (idx + 1) + ". " + s;
      list.appendChild(p);
    });

    box.style.display = "block";
  }

  // 🔹 Main click handler for "Generate Instruction Sentence"
  async function handleGenerateClick() {
    const recipeId = window.currentRecipeId;
    if (!recipeId) {
      showError("No recipe_id found. Please go back and create a recipe again.");
      return;
    }

    const instruction = buildInstructionFromUI();
    if (!instruction) {
      showError("Please drag some components into the drop area first.");
      return;
    }

    if (!instruction.nounRelations || instruction.nounRelations.length === 0) {
      showError("Please add at least one noun relation before generating.");
      return;
    }

    showLoader(true);

    try {
      // 1️⃣ Call /create-graph
      const res = await fetch(`${API_BASE}/create-graph`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe_id: recipeId,
          instruction: instruction,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("create-graph error:", data);
        showError(data.error || data.message || "Failed to create graph");
        return;
      }

      // Store graph_id & usr_id globally for later
      window.currentGraphId = data.graph_id;
      window.currentUsrId = data.usr_id;

      // 2️⃣ Show graph image
      const img = $("graphImage");
      if (img && data.graph_image) {
        img.src = data.graph_image; // already "data:image/png;base64,..."
      }

      // 3️⃣ Show Hindi sentence if present
      if (data.hindi_sentence) {
        const corrected = $("correctedSentenceOutput");
        if (corrected) {
          corrected.textContent = data.hindi_sentence;
        }
      }

      // 4️⃣ Show USR text
      if (data.usr_text) {
        renderUsr(data.usr_text);
      }

      // 5️⃣ Call /send-usr to generate English sentence
      await callSendUsr(recipeId, data.usr_text, data.graph_id, data.usr_id);
    } catch (err) {
      console.error(err);
      showError("Something went wrong while generating sentence.");
    } finally {
      showLoader(false);
    }
  }

  // 🔹 Call /send-usr route
  async function callSendUsr(recipeId, usrText, graphId, usrId) {
    if (!usrText) {
      showError("USR text missing; cannot send to /send-usr");
      return;
    }

    const payload = {
      recipe_id: recipeId,
      usr_text: usrText,
    };

    if (graphId) payload.graph_id = graphId;
    if (usrId) payload.usr_id = usrId;

    const res = await fetch(`${API_BASE}/send-usr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("/send-usr error:", data);
      showError(data.error || "Failed to generate English sentence");
      return;
    }

    // data.english_sentences should be an array
    renderEnglishSentences(data.english_sentences);
  }

  // 🔹 Optional: regenerate USR from stored graph
  async function regenerateUsrFromGraph() {
    const recipeId = window.currentRecipeId;
    const graphId = window.currentGraphId;

    if (!recipeId || !graphId) {
      showError("Cannot regenerate USR: recipe_id or graph_id missing.");
      return;
    }

    const res = await fetch(`${API_BASE}/graphtousr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipeId, graph_id: graphId }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("/graphtousr error:", data);
      showError(data.error || "Failed to regenerate USR");
      return;
    }

    if (data.usr_text) {
      renderUsr(data.usr_text);
    }
  }

  // 🔹 Wire up events on DOM ready
  document.addEventListener("DOMContentLoaded", function () {
    const generateBtn = $("generateBtn");
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.addEventListener("click", handleGenerateClick);
    }

    // If later you add a button to regenerate USR:
    // const regenUsrBtn = $("regenUsrBtn");
    // if (regenUsrBtn) {
    //   regenUsrBtn.addEventListener("click", regenerateUsrFromGraph);
    // }

    // TODO: keep your existing drag & drop logic and item-creation logic here
    // from your old recipe-visual.js. Just make sure that items dropped into
    // #instructionBuilder have data-type + data-value attributes so
    // buildInstructionFromUI() can read them.
  });
})();
