"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  <input
  type="file"
  accept=".pdb"
  onChange={(e) => setFile(e.target.files?.[0] || null)}
  className="border p-2 my-2"
/>
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
    setResponse(JSON.stringify(data, null, 2));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Drug-Target Interaction Visualizer</h1>

      <input
        type="file"
        accept=".pdb" // Check for PDB files
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="border p-2 my-2"
      />

      <button
        onClick={handleUpload}
        className="p-2 bg-blue-500 text-white rounded mt-2"
      >
        Upload
      </button>

      {response && <pre className="mt-4 p-2 bg-gray-100">{response}</pre>}
    </div>
  );

}