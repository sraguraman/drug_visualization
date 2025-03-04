"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // ✅ Spinner for AI loading

declare global {
  interface Window {
    $3Dmol: any;
  }
}

// ✅ Keep the viewer instance global so React never resets it
let viewerInstance: any = null;

const ProteinViewer = forwardRef((_, ref) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const prevPdbUrl = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Allow `page.tsx` to update the viewer without remounting
  useImperativeHandle(ref, () => ({
    updateModel: (pdbUrl: string) => {
      console.log("🚀 Updating model - PDB URL:", pdbUrl);
      if (!scriptLoaded || !viewerRef.current || !window.$3Dmol) return;

      if (!viewerInstance) {
        console.log("⚡ Creating viewer for the first time...");
        viewerInstance = window.$3Dmol.createViewer(viewerRef.current, {
          width: "100%",
          height: "100%",
          backgroundColor: "white",
        });
      }

      if (prevPdbUrl.current !== pdbUrl) {
        console.log("🔄 Loading new PDB model...");
        viewerInstance.clear();
        viewerInstance.removeAllModels();

        fetch(pdbUrl)
          .then((res) => res.text())
          .then((pdbData) => {
            console.log("📄 PDB data received, updating viewer...");
            viewerInstance.addModel(pdbData, "pdb");
            viewerInstance.setStyle({}, { cartoon: { color: "spectrum" } });
            viewerInstance.setStyle({ hetflag: true }, { stick: { colorscheme: "Jmol" } });

            viewerInstance.zoomTo();
            viewerInstance.render();
            console.log("✅ Model added to existing viewer");

            setTimeout(() => {
              console.log("🔧 Resizing viewer...");
              viewerInstance.resize();
            }, 100);
          })
          .catch((err) => console.error("❌ Error loading PDB:", err));

        prevPdbUrl.current = pdbUrl;

        // ✅ Clear AI analysis when a new file is uploaded
        setAnalysis(null);
      }
    },
  }));

  const analyzePDB = async () => {
    if (!prevPdbUrl.current) {
      alert("Please upload a PDB file first.");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch('https://backend-protein-viz.vercel.app/api/analyze_pdb', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdbUrl: prevPdbUrl.current }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Failed to analyze PDB file: ${data.detail || "Unknown error"}`);
      }

      setAnalysis(cleanText(data.pdb_analysis));

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

  const cleanText = (text: string) => {
    return text
      .replace(/\*\*/g, "")
      .replace(/-/g, "•")
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

      {/* ✅ Persistent 3D Viewer (Does Not Unmount) */}
      <div className="relative w-full h-[400px] border rounded-lg">
        <div ref={viewerRef} className="w-full h-full" />
      </div>

      {/* ✅ Controls */}
        <div className="flex space-x-4 mt-4">
        <button
            onClick={() => viewerInstance?.rotate(90) && viewerInstance.render()}
            className="p-3 bg-gray-700 text-white rounded-md shadow-md transition-all duration-150 hover:bg-gray-800 active:scale-95 cursor-pointer"
        >
            🔄 Rotate
        </button>
        <button
            onClick={() => viewerInstance?.zoom(1.2) && viewerInstance.render()}
            className="p-3 bg-blue-600 text-white rounded-md shadow-md transition-all duration-150 hover:bg-blue-700 active:scale-95 cursor-pointer"
        >
            ➕ Zoom In
        </button>
        <button
            onClick={() => viewerInstance?.zoom(0.8) && viewerInstance.render()}
            className="p-3 bg-blue-600 text-white rounded-md shadow-md transition-all duration-150 hover:bg-blue-700 active:scale-95 cursor-pointer"
        >
            ➖ Zoom Out
        </button>
        <button
            onClick={() => viewerInstance?.zoomTo() && viewerInstance.render()}
            className="p-3 bg-red-600 text-white rounded-md shadow-md transition-all duration-150 hover:bg-red-700 active:scale-95 cursor-pointer"
        >
            🔄 Reset
        </button>
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
});

export default ProteinViewer;
