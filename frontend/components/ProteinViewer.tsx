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
    if (!scriptLoaded) return;
    if (!viewerRef.current || !window.$3Dmol || !pdbUrl) return;

    console.log("Initializing 3Dmol.js viewer...");
    try {
      // Set explicit width & height
      const width = viewerRef.current.clientWidth;
      const height = viewerRef.current.clientHeight;

      const viewer = window.$3Dmol.createViewer(viewerRef.current, {
        width: width,
        height: height,
        backgroundColor: "white",
      });

      console.log("Fetching PDB file:", pdbUrl);
      fetch(pdbUrl)
        .then((res) => res.text())
        .then((pdbData) => {
          console.log("PDB file loaded, adding to viewer...");
          viewer.addModel(pdbData, "pdb");
          viewer.setStyle({}, { cartoon: { color: "spectrum" } });
          viewer.zoomTo();
          viewer.render();
          viewer.resize(); // Ensure it fits in the container
          console.log("Rendering complete.");
        })
        .catch((err) => console.error("Error fetching PDB file:", err));

      // Ensure viewer resizes properly
      const handleResize = () => {
        viewer.resize();
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);

    } catch (error) {
      console.error("Error loading protein structure:", error);
    }
  }, [pdbUrl, scriptLoaded]);

  return (
    <div>
      <Script
        src="https://3Dmol.org/build/3Dmol-min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("3Dmol.js script loaded!");
          setScriptLoaded(true);
        }}
        onError={(e) => console.error("Error loading 3Dmol script:", e)}
      />
      {/* Ensure Viewer Stays Inside the Box */}
      <div className="flex justify-center items-center mt-6">
        <div
          ref={viewerRef}
          className="w-[600px] h-[500px] border rounded-lg shadow-lg relative"
          style={{ overflow: "hidden" }} // Prevent overflow issues
        />
      </div>
    </div>
  );
}