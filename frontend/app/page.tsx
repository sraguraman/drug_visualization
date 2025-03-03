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
  const viewerRef = useRef<any>(null); // ✅ Correctly define the viewer reference

  useEffect(() => {
    if (pdbUrl && viewerRef.current) {
      viewerRef.current.updateModel(pdbUrl); // ✅ Update model without unmounting
    }
  }, [pdbUrl]);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.filename) {
        const url = `http://127.0.0.1:8000/files/${data.filename}`;
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
