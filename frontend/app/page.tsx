"use client";

import { useState } from "react";
import ProteinViewer from "../components/ProteinViewer";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pdbUrl, setPdbUrl] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
  
    const res = await fetch("http://127.0.0.1:8000/upload/", {
      method: "POST",
      body: formData,
    });
  
    const data = await res.json();
    if (data.filename) {
      const url = `http://127.0.0.1:8000/files/${data.filename}`;
      console.log("PDB file available at:", url);
      setPdbUrl(url);
    }
  };  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Drug-Target Interaction Visualizer</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-gray-200 text-gray-700 p-3 rounded-md hover:bg-gray-300 transition inline-block w-full text-center"
        >
          {file ? file.name : "Choose a File"}
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".pdb"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleUpload}
          className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition mt-4"
        >
          Upload
        </button>
      </div>

      {pdbUrl && (
        <div className="mt-6 w-full max-w-4xl">
          <ProteinViewer pdbUrl={pdbUrl} />
        </div>
      )}
    </div>
  );
}