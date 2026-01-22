import React, { useEffect, useState } from "react";
import "./sentence-relations.css";

const RELATIONS = [
  "and",
  "or",
  "if",
  "although",
  "after that",
  "because",
  "as a result",
  "but",
  "whereas",
  "so that",
  "for example",
  "therefore",
  "yet",
  "while",
  "next",
];

export default function SentenceRelations() {
  const [baseSentences, setBaseSentences] = useState([]);
  const [combinedSentences, setCombinedSentences] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [relation, setRelation] = useState("and");
  const [combinedResult, setCombinedResult] = useState("—");
  const [finalParagraph, setFinalParagraph] = useState("—");
  const [orders, setOrders] = useState([]); // for reordering combined sentences

  // Load from localStorage on mount
  useEffect(() => {
    const base = JSON.parse(
      localStorage.getItem("correctedSentences") || "[]"
    );
    const combined = JSON.parse(
      localStorage.getItem("combinedSentences") || "[]"
    );

    setBaseSentences(base);
    setCombinedSentences(combined);
    setSentences([...base, ...combined]);
    setOrders(new Array(combined.length).fill(""));
  }, []);

  // Whenever combinedSentences or baseSentences changes, update sentences + localStorage + orders
  useEffect(() => {
    setSentences([...baseSentences, ...combinedSentences]);
    localStorage.setItem(
      "combinedSentences",
      JSON.stringify(combinedSentences)
    );

    setOrders((prev) => {
      const next = [...prev];
      next.length = combinedSentences.length;
      for (let i = 0; i < next.length; i++) {
        if (next[i] === undefined) next[i] = "";
      }
      return next;
    });
  }, [baseSentences, combinedSentences]);

  const toggleSelect = (index) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        if (prev.length >= 2) {
          alert("You can only select two sentences.");
          return prev;
        }
        return [...prev, index];
      }
    });
  };

  const handleCombine = () => {
    if (selectedIndices.length !== 2) {
      alert("Select exactly two sentences.");
      return;
    }

    let s1 = sentences[selectedIndices[0]].trim();
    let s2 = sentences[selectedIndices[1]].trim();

    if (s1.endsWith(".")) s1 = s1.slice(0, -1);
    if (s2.endsWith(".")) s2 = s2.slice(0, -1);

    if (s2.length > 0) {
      s2 = s2.charAt(0).toLowerCase() + s2.slice(1);
    }

    let result = `${s1} ${relation} ${s2}`;
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    setCombinedResult(result);
    setCombinedSentences((prev) => [...prev, result]);
    setSelectedIndices([]);
  };

  const handleRemoveCombined = (index) => {
    setCombinedSentences((prev) => prev.filter((_, i) => i !== index));
    setOrders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrderChange = (index, value) => {
    setOrders((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const generateFinalParagraph = () => {
    if (combinedSentences.length === 0) {
      setFinalParagraph("—");
      return;
    }

    const indexed = [];

    combinedSentences.forEach((sentence, i) => {
      const val = orders[i];
      const order = parseInt(val, 10);
      if (!isNaN(order)) {
        indexed.push({ order, sentence });
      }
    });

    // Sentences without explicit order go to the end
    const assigned = new Set(indexed.map((i) => i.sentence));
    combinedSentences.forEach((sentence, i) => {
      if (!assigned.has(sentence)) {
        indexed.push({ order: i + 1000, sentence });
      }
    });

    indexed.sort((a, b) => a.order - b.order);
    const paragraph = indexed.map((i) => i.sentence).join(" ");
    setFinalParagraph(paragraph || "—");
  };

  return (
    <div className="relations-page">
      <div className="relations-card">
        <h2>🧩 Select Two Sentences</h2>

        {/* Sentence list */}
        <div id="sentenceList">
          {sentences.length === 0 ? (
            <em>
              No sentences found. Please go back and create/correct sentences.
            </em>
          ) : (
            sentences.map((s, i) => (
              <div
                key={i}
                className={
                  "sentence-box" +
                  (selectedIndices.includes(i) ? " selected" : "")
                }
                onClick={() => toggleSelect(i)}
              >
                <strong>{i + 1}.</strong> {s}
              </div>
            ))
          )}
        </div>

        {/* Relation select */}
        <div className="relation-select">
          <label htmlFor="relation">
            <strong>Select Relation:</strong>
          </label>
          <br />
          <select
            id="relation"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          >
            {RELATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <button type="button" onClick={handleCombine}>
          🔗 Combine Sentences
        </button>

        {/* Combined Output */}
        <h3>Combined Output:</h3>
        <p id="combinedResult">{combinedResult}</p>

        {/* List of combined sentences */}
        <h3>All Combined Sentences:</h3>
        <div id="combinedListContainer">
          {combinedSentences.length === 0 ? (
            <em>No combined sentences yet.</em>
          ) : (
            combinedSentences.map((s, i) => (
              <div key={i} className="combined-sentence">
                <input
                  type="number"
                  min="1"
                  className="reorder-number"
                  placeholder="#"
                  value={orders[i] || ""}
                  onChange={(e) => handleOrderChange(i, e.target.value)}
                  style={{ width: "50px", marginRight: "10px" }}
                />
                <span>{baseSentences.length + i + 1}. {s}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCombined(i)}
                >
                  ❌ Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* Final paragraph */}
        <h3>📝 Final Paragraph Output:</h3>
        <div id="finalParagraphOutput">{finalParagraph}</div>
        <button type="button" onClick={generateFinalParagraph}>
          Generate Final Paragraph
        </button>

        <div className="footer">Made with 🌿 by Padma</div>
      </div>
    </div>
  );
}
