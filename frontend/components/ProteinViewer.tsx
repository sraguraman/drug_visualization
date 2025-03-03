"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // ✅ Spinner for AI loading

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
  const viewerInstance = useRef<any>(null); // ✅ Keeps the viewer reference across renders
  const [loading, setLoading] = useState(false); // ✅ AI request state

  // ✅ UseEffect to clear viewer and reload when pdbUrl updates
  useEffect(() => {
    console.log("🚀 useEffect triggered - PDB URL:", pdbUrl);
  
    if (!scriptLoaded || !viewerRef.current || !window.$3Dmol || !pdbUrl) return;
  
    const viewerContainer = viewerRef.current;
  
    // ✅ Force a minimum size before initializing WebGL
    viewerContainer.style.minHeight = "400px";
    viewerContainer.style.minWidth = "400px";
  
    // ✅ Ensure container has a valid size before initializing WebGL
    const waitForContainerSize = () => {
      if (viewerContainer.clientWidth === 0 || viewerContainer.clientHeight === 0) {
        console.warn("⚠️ Viewer container still has zero size! Retrying in 100ms...");
        setTimeout(waitForContainerSize, 100);
        return;
      }
  
      try {
        console.log("⚡ Initializing viewer...");
  
        if (!viewerInstance.current) {
          viewerInstance.current = window.$3Dmol.createViewer(viewerContainer, {
            width: "100%",
            height: "100%",
            backgroundColor: "white",
          });
        } else {
          console.log("🧹 Clearing previous viewer...");
          viewerInstance.current.clear();
          viewerInstance.current.removeAllModels();
        }
  
        fetch(pdbUrl)
          .then((res) => res.text())
          .then((pdbData) => {
            console.log("🔄 PDB data received, loading into viewer...");
  
            viewerInstance.current.addModel(pdbData, "pdb");
            viewerInstance.current.setStyle({}, { cartoon: { color: "spectrum" } });
            viewerInstance.current.setStyle({ hetflag: true }, { stick: { colorscheme: "Jmol" } });
  
            viewerInstance.current.zoomTo();
            viewerInstance.current.render();
            console.log("✅ Model added to viewer");
  
            setTimeout(() => {
              console.log("🔧 Resizing viewer...");
              viewerInstance.current.resize();
              console.log("✅ Viewer resized and should be visible");
            }, 100);
          })
          .catch((err) => console.error("❌ Error loading PDB:", err));
      } catch (error) {
        console.error("❌ Error initializing 3Dmol.js:", error);
      }
    };
  
    // ✅ Delay execution until React properly updates the UI
    setTimeout(waitForContainerSize, 200);
  
  }, [pdbUrl, scriptLoaded]); // ✅ Runs when `pdbUrl` updates  
  
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
      console.error("❌ Error fetching AI analysis:", error);
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
        onError={(e) => console.error("❌ Error loading 3Dmol script:", e)}
      />

      {/* ✅ 3D Viewer */}
      <div className="relative w-full h-[400px] border rounded-lg">
        <div ref={viewerRef} className="w-full h-full" />
      </div>

      {/* ✅ Controls */}
      <div className="flex space-x-4 mt-4">
        <button onClick={() => viewerInstance.current?.rotate(90) && viewerInstance.current.render()} className="p-2 bg-gray-700 text-white rounded-md">🔄 Rotate</button>
        <button onClick={() => viewerInstance.current?.zoom(1.2) && viewerInstance.current.render()} className="p-2 bg-blue-600 text-white rounded-md">➕ Zoom In</button>
        <button onClick={() => viewerInstance.current?.zoom(0.8) && viewerInstance.current.render()} className="p-2 bg-blue-600 text-white rounded-md">➖ Zoom Out</button>
        <button onClick={() => viewerInstance.current?.zoomTo() && viewerInstance.current.render()} className="p-2 bg-red-600 text-white rounded-md">🔄 Reset</button>
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
