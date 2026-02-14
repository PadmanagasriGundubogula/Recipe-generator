import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import food1 from './assets/food1.png';

import Contact from './Contact';

const Home = ({ isLoggedIn, lang, handleLangChange }) => {
  const navigate = useNavigate();
  const [activeInstruction, setActiveInstruction] = useState(null);

  const instructions = {
    1: {
      title: "Step 1: Create & Name",
      description: "Start your recipe by defining its core identity and category.",
      steps: [
        "Select a category (e.g., Appetizer, Beverage, Main Course) from the dropdown. This tells the AI what kind of verbs and ingredients to expect.",
        "Input a unique name for your dish. Creative names like 'Spicy Zesty Pasta' help the generator's flavor profile.",
        "Click the 'Start Generating' button. This creates a secure entry in our database for your new recipe.",
        "You will be redirected to Step 2: The Visual Builder."
      ],
      tip: "Specific names often yield better automated suggestions for tools and secondary ingredients!"
    },
    2: {
      title: "Step 2: Build with Voice & Vision",
      description: "Construct each step of your recipe visually or by using advanced voice commands.",
      steps: [
        "Use the Side Palette: Find Actions (Mix, Chop), Ingredients, and Tools.",
        "Voice Input: Click the 🎙️ icon to speak your instruction naturally. Our AI transcribes and structures it for you!",
        "Guided Voice Mode: Use '🎧 Guided Voice' for a step-by-step assistant that helps you fill in actions and ingredients one-by-one.",
        "Click to Add: Or manually click on items in the side palette to add them into the central workspace.",
        "Generate: Once a step looks complete, hit 'Generate Sentence' to see the AI turn your input into a perfect instruction.",
      ],
      tip: "You can even listen to your generated steps by clicking the 🔊 icon!"
    },
    3: {
      title: "Step 3: Combine & Finalize",
      description: "The final touch: merging individual steps into a professional, cohesive recipe paragraph.",
      steps: [
        "Select & Connect: Click TWO sentences from your list of generated steps. Note: You need at least two sentences to enable the 'Add Discourse' feature.",
        "Apply Logic: Choose a relation like 'Sequence' (then), 'Condition' (if), or 'Contrast' (but).",
        "Inspect: Use the 🔍 icon to see the linguistic 'USR' structure—the same logic used by language models!",
        "Order: Use the numerical inputs to reorder your final paragraphs for the best logical flow.",
        "Generate Running Text: This merges all your work into a single, polished recipe ready for sharing."
      ],
      tip: "Logical relations turn a list of commands into a readable, easy-to-follow cooking story."
    }
  };

  return (
    <div className="home-container">
      {/* Home Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Generate your <span className="highlight">Recipes</span> with AI Intelligence
          </h1>
          <p className="hero-subtitle">
            Experience the future of cooking. Our AI-powered generator helps you create, refine, and organize recipes like never before.
          </p>
          <div className="hero-actions">
            <button className="btn-primary start-btn" onClick={() => isLoggedIn ? navigate('/page1') : navigate('/login')}>
              {isLoggedIn ? 'Start Generating' : 'Login'}
            </button>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={food1} alt="Delicious Food" className="hero-img" />
          <div className="stats-badge">
            <span className="stats-icon">⭐</span>
            <div className="stats-text">
              <span className="stats-number">10K+</span>
              <span className="stats-label">Recipes Generated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Generate Tool Section (Recipe Tool) */}
      <section id="generate" className="generate-tool-section">
        <div className="generate-card">
          <div className="generate-info">
            <h2 className="section-title">Powerful <span className="highlight">Generator</span></h2>
            <p className="section-description">
              Our tool doesn't just list ingredients; it builds a story. From selecting the
              recipe type to ordering sentences for the perfect flow, we cover it all.
            </p>
            <ul className="tool-features">
              <li>✅ Personalized Recipe Types</li>
              <li>✅ Voice-to-Recipe Transcription</li>
              <li>✅ AI-Driven Sentence Generation</li>
              <li>✅ Intuitive Reordering Logic</li>
              <li>✅ Text-to-Speech Feedback</li>
            </ul>
            <button className="btn-primary start-btn" onClick={() => isLoggedIn ? navigate('/page1') : navigate('/login')}>
              {isLoggedIn ? 'Explore Tool' : 'Login'}
            </button>
          </div>
          <div className="generate-visual">
            <img
              src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=800&q=80"
              alt="AI Recipe Generation"
              className="generate-img"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It <span className="highlight">Works</span></h2>
          <p>Get started with our AI Recipe Generator in 3 simple steps</p>
          <div className="underline"></div>
        </div>
        <div className="steps-container">
          <div className="step-card clickable-card" onClick={() => setActiveInstruction(1)}>
            <div className="step-number">1</div>
            <h4>Create & Name</h4>
            <p>Select your recipe type and give it a name to start the creation process.</p>
            <span className="learn-more">Click to learn more ➔</span>
          </div>
          <div className="step-arrow">➜</div>
          <div className="step-card clickable-card" onClick={() => setActiveInstruction(2)}>
            <div className="step-number">2</div>
            <h4>Build Instructions</h4>
            <p>Click actions, ingredients, and tools to build step-by-step instructions visually.</p>
            <span className="learn-more">Click to learn more ➔</span>
          </div>
          <div className="step-arrow">➜</div>
          <div className="step-card clickable-card" onClick={() => setActiveInstruction(3)}>
            <div className="step-number">3</div>
            <h4>Combine & Finalize</h4>
            <p>Link your generated sentences with logical relations to create a smooth, readable recipe.</p>
            <span className="learn-more">Click to learn more ➔</span>
          </div>
        </div>

        {/* Demo Recipe Section */}
        <div className="demo-recipe-section" style={{ marginTop: "60px", padding: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="section-header" style={{ marginBottom: "30px" }}>
            <h2 className="section-title">Example <span className="highlight">Recipe</span></h2>
            <p>See what you can create with our visual builder</p>
          </div>
          <div className="demo-recipe-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "left", background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", color: "#333" }}>
            <h3 style={{ color: "#214736", marginBottom: "20px", borderBottom: "2px solid #76c893", paddingBottom: "10px" }}>Masala Chai ☕</h3>
            <div className="demo-steps">
              <div className="demo-step" style={{ marginBottom: "20px" }}>
                <span className="demo-step-num" style={{ fontWeight: "bold", color: "#4c6fff", marginRight: "10px" }}>Step 1:</span>
                <p style={{ display: "inline" }}>Pour 1 cup of water into a saucepan and bring to a boil.</p>
              </div>
              <div className="demo-step" style={{ marginBottom: "20px" }}>
                <span className="demo-step-num" style={{ fontWeight: "bold", color: "#4c6fff", marginRight: "10px" }}>Step 2:</span>
                <p style={{ display: "inline" }}>Add 2 tsp of tea leaves, 1 tsp of sugar, and crushed ginger.</p>
              </div>
              <div className="demo-step">
                <span className="demo-step-num" style={{ fontWeight: "bold", color: "#4c6fff", marginRight: "10px" }}>Step 3:</span>
                <p style={{ display: "inline" }}>Add 1/2 cup of milk and simmer for 2 minutes before straining.</p>
              </div>
            </div>
            <div style={{ marginTop: "30px", padding: "15px", background: "#f0fdf4", borderRadius: "10px", border: "1px dashed #76c893" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", fontStyle: "italic", color: "#214736" }}>
                💡 This recipe was built using the visual builder without typing any instructions!
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Instruction Modal */}
        {activeInstruction && (
          <div className="home-modal-overlay" onClick={() => setActiveInstruction(null)}>
            <div className="home-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="home-modal-close" onClick={() => setActiveInstruction(null)}>×</button>
              <div className="home-modal-header">
                <span className="home-modal-step-tag">Step {activeInstruction}</span>
                <h2>{instructions[activeInstruction].title}</h2>
              </div>
              <div className="home-modal-body">
                <p className="home-modal-desc">{instructions[activeInstruction].description}</p>
                <ul className="home-modal-steps">
                  {instructions[activeInstruction].steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
                <div className="home-modal-tip">
                  <strong>💡 Pro Tip:</strong> {instructions[activeInstruction].tip}
                </div>
              </div>
              <div className="home-modal-footer">
                <button className="btn-primary" onClick={() => setActiveInstruction(null)}>Got it!</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="section-header">
          <h2 className="section-title">About <span className="highlight">Us</span></h2>
          <div className="underline"></div>
        </div>
        <div className="about-grid">
          <div className="about-text">
            <h3>Our Mission</h3>
            <p>
              At RecipeGen, we believe that everyone has the potential to be a master chef.
              Our mission is to empower home cooks and professionals alike by providing
              state-of-the-art AI tools to generate, organize, and perfect culinary creations.
            </p>
            <p>
              Whether you're looking for a quick weeknight dinner or a complex five-course meal,
              our intelligence-driven platform adapts to your preferences and pantry.
            </p>
          </div>
          <div className="about-features">
            <div className="feature-card">
              <span className="feature-icon">🚀</span>
              <h4>Fast Generation</h4>
              <p>Get a complete recipe in seconds based on your ingredients.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🧠</span>
              <h4>Smart AI</h4>
              <p>Our models understand flavor profiles and cooking techniques.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="home-contact-section">
        <div className="section-header">
          <h2 className="section-title">Get in <span className="highlight">Touch</span></h2>
          <p>Have questions? We're here to help you.</p>
        </div>
        <Contact />
      </section>
    </div>
  );
};

export default Home;
