import "./App.css";
import React, { useState } from "react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [colorScheme, setColorScheme] = useState("");
  const [stack, setStack] = useState("");
  const [loading, setLoading] = useState(false);

  async function downloadZip() {
    setLoading(true);

    try {
      const user_prompt = JSON.stringify({
        prompt,
        description,
        color_scheme: colorScheme,
        stack,
      });

      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_prompt }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const blob = await res.blob();

      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || "generated_project.zip";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while generating the project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="App">
      <h1>AI Project Generator</h1>
      <p className="subtitle">Describe your app and download the code instantly</p>

      <div className="form">
        <label>
          App Prompt
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build a todo app"
          />
        </label>

        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="For students with deadlines"
          />
        </label>

        <label>
          Color Scheme
          <input
            type="text"
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value)}
            placeholder="Dark mode, pastel accents"
          />
        </label>

        <label>
          Tech Stack
          <input
            type="text"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder="HTML/CSS/JS or React + Tailwind"
          />
        </label>

        <button onClick={downloadZip} disabled={loading}>
          {loading ? "Generating…" : "Generate & Download ZIP"}
        </button>

        {loading && (
          <div className="loading">
            <span className="spinner" />
            <span>Building your project…</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
