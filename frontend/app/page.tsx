"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: formData,
      redirect: "follow",
    });

    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
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

      {response && (
        <pre className="mt-6 p-4 bg-white rounded-lg shadow-lg w-3/4 max-w-2xl text-left">
          {response}
        </pre>
      )}
    </div>
  );
}
