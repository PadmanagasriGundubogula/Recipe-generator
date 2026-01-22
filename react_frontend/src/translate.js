// translate.js
export async function translateText(text, targetLang, sourceLang = "auto") {
  if (!text || !text.trim()) return text;

  // No translation needed
  if (
    !targetLang ||
    targetLang === "en" && (sourceLang === "en" || sourceLang === "auto")
  ) {
    return text;
  }

  try {
    const res = await fetch(
      "https://translate.googleapis.com/translate_a/single" +
        "?client=gtx" +
        "&sl=" + encodeURIComponent(sourceLang) +
        "&tl=" + encodeURIComponent(targetLang) +
        "&dt=t&q=" + encodeURIComponent(text)
    );
    const data = await res.json();
    return data[0].map((part) => part[0]).join("");
  } catch (err) {
    console.error("translateText error:", err);
    return text; // fallback
  }
}
