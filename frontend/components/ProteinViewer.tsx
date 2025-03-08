"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";

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
  const [scriptLoaded, setScriptLoaded] = useState(false);

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
      viewerInstance.resize();
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

      {/* ✅ 3D Viewer */}
      <div className="relative w-full h-[400px] border rounded-lg">
        <div ref={viewerRef} className="w-full h-full" />
      </div>

      {/* ✅ Restored Controls */}
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
    </div>
  );
});

export default ProteinViewer;
