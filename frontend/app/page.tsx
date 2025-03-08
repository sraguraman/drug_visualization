"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // ✅ Spinner for AI loading

declare global {
  interface Window {
    $3Dmol: any;
  }
}

// ✅ Define props type
type ProteinViewerProps = {
  pdbData?: string | null; // ✅ Allow passing pdbData
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
      console.log("🚀 Updating model with in-memory PDB data...");
      if (!scriptLoaded || !viewerRef.current || !window.$3Dmol) return;

      if (!viewerInstance) {
        console.log("⚡ Creating viewer for the first time...");
        viewerInstance = window.$3Dmol.createViewer(viewerRef.current, {
          width: "100%",
          height: "100%",
          backgroundColor: "white",
        });
      }

      viewerInstance.clear();
      viewerInstance.removeAllModels();

      console.log("📄 PDB data received, updating viewer...");
      viewerInstance.addModel(newPdbData, "pdb");
      viewerInstance.setStyle({}, { cartoon: { color: "spectrum" } });
      viewerInstance.setStyle({ hetflag: true }, { stick: { colorscheme: "Jmol" } });

      viewerInstance.zoomTo();
      viewerInstance.render();
      console.log("✅ Model added to existing viewer");

      setTimeout(() => {
        console.log("🔧 Resizing viewer...");
        viewerInstance.resize();
      }, 100);

      // ✅ Clear AI analysis when a new file is uploaded
      setAnalysis(null);
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

  return (
    <div className="flex flex-col items-center w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
      <Script
        src="https://3Dmol.org/build/3Dmol-min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={(e) => console.error("❌ Error loading 3Dmol script:", e)}
      />

      <div className="relative w-full h-[400px] border rounded-lg">
        <div ref={viewerRef} className="w-full h-full" />
      </div>
    </div>
  );
});

export default ProteinViewer;
