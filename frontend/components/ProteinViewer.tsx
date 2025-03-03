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
  const [viewer, setViewer] = useState<any>(null);

  useEffect(() => {
    if (!scriptLoaded) return;
    if (!viewerRef.current || !window.$3Dmol || !pdbUrl) return;

    console.log("Initializing 3Dmol.js viewer...");
    try {
      const width = viewerRef.current.clientWidth;
      const height = viewerRef.current.clientHeight;

      const newViewer = window.$3Dmol.createViewer(viewerRef.current, {
        width: width,
        height: height,
        backgroundColor: "white",
      });

      console.log("Fetching PDB file:", pdbUrl);
      fetch(pdbUrl)
        .then((res) => res.text())
        .then((pdbData) => {
          console.log("PDB file loaded, adding to viewer...");
          newViewer.addModel(pdbData, "pdb");

          // Protein Backbone - Cartoon Representation
          newViewer.setStyle({}, { cartoon: { color: "spectrum" } });

          // Highlight Ligands - Ball-and-Stick Model
          newViewer.setStyle(
            { hetflag: true }, // Selects ligands
            { stick: { colorscheme: "Jmol" } }
          );

          newViewer.zoomTo();
          newViewer.render();
          newViewer.resize();
          console.log("Rendering complete.");
        })
        .catch((err) => console.error("Error fetching PDB file:", err));

      setViewer(newViewer);

      const handleResize = () => {
        newViewer.resize();
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);

    } catch (error) {
      console.error("Error loading protein structure:", error);
    }
  }, [pdbUrl, scriptLoaded]);

  // 🟢 Rotation Control
  const rotateModel = () => {
    if (viewer) {
      viewer.rotate(90); // Rotate 90 degrees
      viewer.render();
    }
  };

  // 🟢 Zoom In
  const zoomIn = () => {
    if (viewer) {
      viewer.zoom(1.2); // Zoom in by 20%
      viewer.render();
    }
  };

  // 🟢 Zoom Out
  const zoomOut = () => {
    if (viewer) {
      viewer.zoom(0.8); // Zoom out by 20%
      viewer.render();
    }
  };

  // 🟢 Reset View
  const resetView = () => {
    if (viewer) {
      viewer.zoomTo(); // Reset zoom and centering
      viewer.render();
    }
  };

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
      {/* Viewer Container */}
      <div className="flex flex-col items-center mt-6">
        <div
          ref={viewerRef}
          className="w-[600px] h-[500px] border rounded-lg shadow-lg relative"
          style={{ overflow: "hidden" }}
        />
        {/* 🟢 Control Buttons */}
        <div className="mt-4 flex space-x-4">
          <button onClick={rotateModel} className="p-2 bg-gray-700 text-white rounded-md">🔄 Rotate</button>
          <button onClick={zoomIn} className="p-2 bg-blue-600 text-white rounded-md">➕ Zoom In</button>
          <button onClick={zoomOut} className="p-2 bg-blue-600 text-white rounded-md">➖ Zoom Out</button>
          <button onClick={resetView} className="p-2 bg-red-600 text-white rounded-md">🔄 Reset</button>
        </div>
      </div>
    </div>
  );
}
