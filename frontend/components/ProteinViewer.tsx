"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    $3Dmol: any;
  }
}

export default function ProteinViewer({ pdbUrl }: { pdbUrl: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!scriptLoaded) return; // Ensure script is loaded
    if (!viewerRef.current || !window.$3Dmol || !pdbUrl) return;

    try {
      const viewer = window.$3Dmol.createViewer(viewerRef.current, {
        backgroundColor: "white",
      });

      viewer.addModel(pdbUrl, "pdb");
      viewer.setStyle({}, { cartoon: { color: "spectrum" } });
      viewer.zoomTo();
      viewer.render();
    } catch (error) {
      console.error("Error loading protein structure:", error);
    }
  }, [pdbUrl, scriptLoaded]);

  return (
    <div>
      <Script
        src="https://3Dmol.org/build/3Dmol-min.js"
        strategy="beforeInteractive"
        onLoad={() => setScriptLoaded(true)} // Ensure script is ready
        onError={(e) => console.error("Error loading 3Dmol script:", e)}
      />
      <div ref={viewerRef} className="w-full h-[500px] border mt-4" />
    </div>
  );
}
