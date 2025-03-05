"use client";

import { useState, useRef, useEffect } from "react";
import ProteinViewer from "../components/ProteinViewer";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Image from "next/image";
import dnaStrand from "../public/dna-strand.png";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pdbUrl, setPdbUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (pdbUrl && viewerRef.current) {
      viewerRef.current.updateModel(pdbUrl);
    }
  }, [pdbUrl]);

  const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://your-vercel-backend.vercel.app/api'
    : 'http://localhost:8000/api';

const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.filename) {
        const url = `https://backend-protein-viz.vercel.app/files/${data.filename}`;
        console.log("✅ PDB file available at:", url);
        setPdbUrl(url);
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
    } finally {
      setUploading(false);
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

      {/* ✅ Example PDB Download Button */}
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
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
          }}
        />

        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full mt-5 p-3 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
            uploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer"
          }`}
        >
          {uploading && <AiOutlineLoading3Quarters className="animate-spin" />}
          <span>{uploading ? "Uploading..." : "Upload"}</span>
        </button>
      </div>

      {/* ✅ Viewer stays persistent and does not re-mount */}
      <div className="mt-6 w-full max-w-4xl">
        <ProteinViewer ref={viewerRef} />
      </div>
    </div>
  );
}
