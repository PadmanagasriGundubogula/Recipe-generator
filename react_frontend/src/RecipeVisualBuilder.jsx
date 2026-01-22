import React, { useEffect } from "react";
import "./recipe-visual.css";

export default function RecipeVisualBuilder() {
  useEffect(() => {
    // Dynamically load the old vanilla JS so all your functions work
    const script = document.createElement("script");
    script.src = process.env.PUBLIC_URL + "/recipe-visual.js";
    script.async = false; // keep execution order
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="builder-page">
      <div className="card builder-card">
        <h1 id="recipeTitle">Recipe Details</h1>
        <p>
          <strong>Type:</strong> <span id="recipeType"></span>
        </p>

        <hr style={{ margin: "24px 0" }} />
        <h2 style={{ color: "#2d3748" }}>Build Your Recipe Instructions Visually</h2>

        {/* COMPONENT SECTIONS */}
        <div className="component-sections scrollable-list">
          {/* Actions */}
          <div className="component-section">
            <div className="section-title">⚡ Actions</div>
            <div className="actions-grid">
              {/* "Add New" (real items will be added by JS) */}
              <div
                className="action-item add-new"
                id="addActionButton"
              >
                <span className="action-icon">➕</span>
                <span className="action-name">Add New</span>
              </div>
            </div>

            {/* Add New Action Form */}
            <div className="add-form" id="actionForm" style={{ display: "none" }}>
              <input
                type="text"
                id="newActionName"
                placeholder="Action name"
                className="add-input"
              />
              <input
                type="text"
                id="newActionEmoji"
                placeholder="Emoji (e.g., ⚡)"
                className="add-input"
              />
              <div className="form-buttons">
                <button id="addActionBtn" className="add-btn">
                  Add
                </button>
                <button id="cancelActionBtn" className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="component-section">
            <div className="section-title">🥄 Ingredients</div>
            <div className="ingredients-grid">
              <div
                className="ingredient-item add-new"
                id="addIngredientButtonTop"
              >
                <span className="ingredient-image">➕</span>
                <span className="ingredient-name">Add New</span>
              </div>
            </div>

            {/* Other Entities */}
            <div className="section-title other-style">💭 Other Entities</div>
            <div className="other-entities-grid" id="otherIngredientsGrid">
              <div
                className="ingredient-item add-new"
                id="addIngredientButtonBottom"
              >
                <span className="ingredient-image">➕</span>
                <span className="ingredient-name">Add New</span>
              </div>
            </div>

            {/* Add Ingredient Form */}
            <div className="add-form" id="ingredientForm" style={{ display: "none" }}>
              <input
                type="text"
                id="newIngredientName"
                placeholder="Ingredient name"
                className="add-input"
              />
              <input
                type="text"
                id="newIngredientEmoji"
                placeholder="Emoji (e.g., 🥖)"
                className="add-input"
              />
              <div className="form-buttons">
                <button id="addIngredientBtn" className="add-btn">
                  Add
                </button>
                <button id="cancelIngredientBtn" className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Descriptors */}
          <div className="component-section">
            <div className="section-title">📝 Descriptors</div>
            <div className="descriptors-grid">
              <div
                className="descriptor-item add-new"
                id="addDescriptorButton"
              >
                <span className="descriptor-icon">➕</span>
                <span className="descriptor-name">Add New</span>
              </div>
            </div>

            {/* Add Descriptor Form */}
            <div className="add-form" id="descriptorForm" style={{ display: "none" }}>
              <input
                type="text"
                id="newDescriptorName"
                placeholder="Descriptor name"
                className="add-input"
              />
              <input
                type="text"
                id="newDescriptorEmoji"
                placeholder="Emoji (e.g., 🌟)"
                className="add-input"
              />
              <div className="form-buttons">
                <button id="addDescriptorBtn" className="add-btn">
                  Add
                </button>
                <button id="cancelDescriptorBtn" className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RELATIONS */}
        <div className="relations-section">
          <h2>Relations</h2>
          <div className="relation-words" id="relationWords">
            <div className="relation-word" draggable="true" data-type="relation" data-value="What(subject)">
              What(subject)
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="What(object)">
              What(object)
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="Whom">
              Whom
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="Which">
              Which
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="Modifier">
              Modifier
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="When">
              When
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="How">
              How
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="in order to">
              in order to
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="How long">
              How long
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="With">
              With what
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="From where">
              From where
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="To where">
              To where
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="Why(reason)">
              Why(reason)
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="which">
              which
            </div>
            <div className="relation-word" draggable="true" data-type="relation" data-value="whose">
              whose
            </div>
          </div>

          {/* DROP ZONE */}
          <div className="drop-zone" id="dropZone">
            <h3>🎯 Drag components here to build your instruction</h3>
            <div className="instruction-builder" id="instructionBuilder" />
            <button className="clear-btn" id="clearInstructionBtn">
              Clear All
            </button>
          </div>

          {/* Quantity / measurement fields */}
          <div id="measurementFields" className="measurement-fields">
            <label htmlFor="quantityInput">Quantity:</label>
            <input
              type="number"
              id="quantityInput"
              className="form-control"
              placeholder="e.g. 2"
            />

            <label htmlFor="measurementInput">Measurement Unit:</label>
            <input
              type="text"
              id="measurementInput"
              className="form-control"
              placeholder="e.g. चम्मच"
            />
          </div>

          {/* GENERATE SECTION */}
          <div className="generate-section">
            <button className="generate-btn" id="generateBtn" disabled>
              ✨ Generate Instruction Sentence
            </button>
            <button className="generate-btn" id="translateHindi">
              Hindi
            </button>

            <div
              className="generated-instructions"
              id="generatedInstructions"
              style={{ display: "none" }}
            >
              <h4 style={{ color: "#2d3748", marginBottom: 10 }}>
                Generated Instructions:
              </h4>
              <div id="instructionsList" />
            </div>
          </div>

          {/* GRAPH */}
          <div id="graphSection" style={{ marginTop: 20 }}>
            <h4 style={{ color: "#2d3748" }}>📊 Generated Graph</h4>
            <img
              id="graphImage"
              src=""
              alt="Graph"
              style={{
                maxWidth: "100%",
                height: "auto",
                border: "1px solid #ccc",
                padding: 8,
              }}
            />
          </div>

          {/* USR TABLE */}
          <div id="usrSection" style={{ marginTop: 20 }}>
            <h4 style={{ color: "#2d3748" }}>📋 Generated USR</h4>
            <div id="usrTableContainer" style={{ marginTop: 20 }} />
          </div>

          <p
            id="correctedSentenceOutput"
            style={{
              fontWeight: 600,
              fontSize: 18,
              color: "green",
              marginTop: 10,
            }}
          />

          <div
            id="externalAPIOutput"
            style={{
              marginTop: 20,
              color: "black",
              border: "1px solid #ccc",
              padding: 10,
            }}
          >
            clickhere
          </div>

          {/* Navigation buttons + Modal trigger */}
          <div style={{ marginTop: 30 }}>
            <button
              type="button"
              className="back-btn"
              data-toggle="modal"
              data-target="#exampleModal"
            >
              ✅ Submit
            </button>

            <a href="/" className="back-btn" style={{ marginLeft: 10 }}>
              ← Go Back
            </a>
          </div>
        </div>
      </div>

      {/* Bootstrap modal (Bootstrap JS will handle this) */}
      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog mt-5">
          <div className="modal-content">
            <div className="modal-header">
              <h5
                className="modal-title thanking-customers-section-modal-title"
                id="exampleModalLabel"
              >
                final check
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="modal-body">
              <h1>
                Want to add more? Click "Back to Edit" or click "Continue to
                Submit"
              </h1>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
              >
                Back to Edit
              </button>

              <a href="/page3" className="btn btn-primary">
                Continue to Submit
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Loader overlay */}
      <div
        id="loader"
        style={{
          display: "none",
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
              borderTop: "6px solid #007bff",
              borderRadius: "50%",
              width: 60,
              height: 60,
              animation: "spin 1s linear infinite",
              margin: "auto",
            }}
          />
          <p style={{ fontWeight: 600, marginTop: 10 }}>
            Generating sentence… please wait
          </p>
        </div>
      </div>
    </div>
  );
}
