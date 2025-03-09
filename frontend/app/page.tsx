"use client";

import { useState, useRef, useEffect } from "react";
import ProteinViewer from "../components/ProteinViewer";
import Image from "next/image";
import dnaStrand from "../public/dna-strand.png";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pdbData, setPdbData] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pdbData && viewerRef.current) {
      console.log("Updating model:", pdbData);
    }
  }, [pdbData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPdbData(event.target.result as string);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-6">
      <Image src={dnaStrand} alt="DNA Strand" width={100} height={100} className="mb-4" />

      <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-6 tracking-tight">
        Protein Visualizer
      </h1>
      <p className="text-gray-600 text-center mb-6">
        Upload a <strong>.PDB</strong> file to visualize a <strong>3D interactable protein structure with ligands</strong>.
      </p>

      <a
        href="/7lyj.pdb"
        download="7lyj.pdb"
        className="mb-3 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow hover:bg-green-700 transition-all duration-200 cursor-pointer flex items-center"
      >
        📥 Download Example PDB File
      </a>

      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center w-96">
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-gray-100 text-gray-700 px-6 py-3 rounded-lg shadow-sm hover:bg-gray-200 transition-all duration-200 flex items-center justify-center w-full text-center font-medium"
        >
          {file ? file.name : "Choose a File"}
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".pdb"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-6 w-full max-w-4xl">
        <ProteinViewer ref={viewerRef} pdbData={pdbData} />
      </div>
    </div>
  );
}
