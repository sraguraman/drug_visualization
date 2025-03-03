"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // ✅ Spinner icon for loading

declare global {
  interface Window {
    $3Dmol: any;
  }
}

export default function ProteinViewer({ pdbUrl }: { pdbUrl: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null); // ✅ Reference for scrolling
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [loading, setLoading] = useState(false); // ✅ AI request state

  useEffect(() => {
    if (!scriptLoaded || !viewerRef.current || !window.$3Dmol || !pdbUrl) return;

    try {
      const newViewer = window.$3Dmol.createViewer(viewerRef.current, {
        width: "100%",
        height: "100%",
        backgroundColor: "white",
      });

      fetch(pdbUrl)
        .then((res) => res.text())
        .then((pdbData) => {
          newViewer.addModel(pdbData, "pdb");

          // ✅ Protein Backbone
          newViewer.setStyle({}, { cartoon: { color: "spectrum" } });

          // ✅ Highlight Ligands
          newViewer.setStyle({ hetflag: true }, { stick: { colorscheme: "Jmol" } });

          newViewer.zoomTo();
          newViewer.render();
          newViewer.resize();
          setViewer(newViewer);
        })
        .catch((err) => console.error("Error loading PDB:", err));
    } catch (error) {
      console.error("Error initializing 3Dmol.js:", error);
    }
  }, [pdbUrl, scriptLoaded]);

  const analyzePDB = async () => {
    if (!pdbUrl) {
      alert("Please upload a PDB file first.");
      return;
    }

    setLoading(true); // ✅ Show loading state
    setAnalysis(null); // ✅ Clear previous result

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze_pdb/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdbUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Failed to analyze PDB file: ${data.detail || "Unknown error"}`);
      }

      setAnalysis(cleanText(data.pdb_analysis));

      // ✅ Auto-scroll down to analysis
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      setAnalysis("Error retrieving analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cleans AI response text
  const cleanText = (text: string) => {
    return text
      .replace(/\*\*/g, "") // Removes markdown bolding
      .replace(/-/g, "•") // Converts hyphens to bullet points
      .trim();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
      <Script
        src="https://3Dmol.org/build/3Dmol-min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={(e) => console.error("Error loading 3Dmol script:", e)}
      />

      {/* ✅ 3D Viewer */}
      <div className="relative w-full h-[400px] border rounded-lg">
        <div ref={viewerRef} className="w-full h-full" />
      </div>

      {/* ✅ Controls */}
      <div className="flex space-x-4 mt-4">
        <button onClick={() => viewer?.rotate(90) && viewer.render()} className="p-2 bg-gray-700 text-white rounded-md">🔄 Rotate</button>
        <button onClick={() => viewer?.zoom(1.2) && viewer.render()} className="p-2 bg-blue-600 text-white rounded-md">➕ Zoom In</button>
        <button onClick={() => viewer?.zoom(0.8) && viewer.render()} className="p-2 bg-blue-600 text-white rounded-md">➖ Zoom Out</button>
        <button onClick={() => viewer?.zoomTo() && viewer.render()} className="p-2 bg-red-600 text-white rounded-md">🔄 Reset</button>
      </div>

      {/* ✅ AI Analysis Button */}
      <button
        onClick={analyzePDB}
        disabled={loading}
        className={`mt-4 p-3 text-white rounded-md transition-all flex items-center justify-center space-x-2 ${
          loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 cursor-pointer"
        }`}
      >
        {loading && <AiOutlineLoading3Quarters className="animate-spin" />}
        <span>{loading ? "Analyzing..." : "🧬 Analyze PDB Structure"}</span>
      </button>

      {/* ✅ AI Analysis Output (Auto-scroll + Cleaned Text) */}
      {analysis && (
        <div
          ref={analysisRef}
          className="mt-6 p-4 bg-gray-100 rounded-md w-full text-gray-900 shadow-md animate-fade-in"
        >
          <h3 className="text-lg font-bold mb-2">AI Analysis</h3>
          <p className="text-gray-700 whitespace-pre-line">{analysis}</p>
        </div>
      )}
    </div>
  );
}
