"use client";

import { useRef, useState } from "react";

type Props = {
  onFileChange: (file: File | null) => void;
};

export default function CreateImageField({ onFileChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File) {
    if (!file.type.startsWith("image/")) {
      return "Only images allowed";
    }

    if (file.size > 1024 * 1024) {
      return "Max size is 1MB";
    }

    return null;
  }

  function handleFile(file: File) {
    const err = validate(file);

    if (err) {
      setError(err);
      onFileChange(null);
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handleFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 
                   hover:border-blue-500 cursor-pointer flex items-center justify-center
                   overflow-hidden bg-gray-50 transition"
      >
        {preview ? <img src={preview} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500 text-center px-2">Add photo</span>}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChange} />

      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-gray-400">Optional • Max 1MB</p>
    </div>
  );
}
