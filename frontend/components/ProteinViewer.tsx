"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // ✅ Spinner for AI loading

declare global {
  interface Window {
    $3Dmol: any;
  }
}

type ProteinViewerProps = {
  pdbData?: string | null;
};

let viewerInstance: any = null;

const ProteinViewer = forwardRef(({ pdbData }: ProteinViewerProps, ref) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    updateModel: (newPdbData: string) => {
      if (!scriptLoaded || !viewerRef.current || !window.$3Dmol) return;

      if (!viewerInstance) {
        viewerInstance = window.$3Dmol.createViewer(viewerRef.current, {
          width: "100%",
          height: "100%",
          backgroundColor: "white",
        });
      }

      viewerInstance.clear();
      viewerInstance.removeAllModels();
      viewerInstance.addModel(newPdbData, "pdb");
      viewerInstance.setStyle({}, { cartoon: { color: "spectrum" } });
      viewerInstance.setStyle({ hetflag: true }, { stick: { colorscheme: "Jmol" } });
      viewerInstance.zoomTo();
      viewerInstance.render();

      // ✅ Fix viewer resize on load
      setTimeout(() => {
        viewerInstance.resize();
      }, 200);
    },
  }));

  useEffect(() => {
    if (pdbData) {
      viewerInstance?.clear();
      viewerInstance?.removeAllModels();
      viewerInstance?.addModel(pdbData, "pdb");
      viewerInstance?.setStyle({}, { cartoon: { color: "spectrum" } });
      viewerInstance?.setStyle({ hetflag: true }, { stick: { colorscheme: "Jmol" } });
      viewerInstance?.zoomTo();
      viewerInstance?.render();
    }
  }, [pdbData]);

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://protein-viz.vercel.app/api"
      : "http://localhost:8000/api";

  const analyzePDB = async () => {
    if (!pdbData) {
      alert("Please upload a PDB file first.");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch(`${API_BASE_URL}/analyze_pdb/`, { // ✅ Fix: Ensure correct API path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdbData }),
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
    return text.replace(/\*\*/g, "").replace(/-/g, "•").trim();
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

      {/* ✅ Controls Restored */}
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

      {/* ✅ AI Analysis Output */}
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
