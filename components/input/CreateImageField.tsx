"use client";

import { useEffect, useRef, useState } from "react";
import { prepareImage } from "@/lib/uploadImage";

type Props = {
  onFileChange: (file: File | null) => void;
};

const MAX_RAW_SIZE = 25 * 1024 * 1024;

export default function CreateImageField({ onFileChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const requestIdRef = useRef(0);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function validate(file: File) {
    const isImage = file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
    if (!isImage) {
      return "Only images allowed";
    }

    if (file.size > MAX_RAW_SIZE) {
      return "That photo is too large";
    }

    return null;
  }

  async function handleFile(file: File) {
    const err = validate(file);
    const requestId = ++requestIdRef.current;

    if (err) {
      setError(err);
      onFileChange(null);
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      const finalFile = await prepareImage(file);
      if (requestId !== requestIdRef.current) return; // a newer selection already superseded this one

      const objectUrl = URL.createObjectURL(finalFile);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = objectUrl;
      setPreview(objectUrl);
      onFileChange(finalFile);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Couldn't process that photo, try another");
      onFileChange(null);
    } finally {
      if (requestId === requestIdRef.current) setProcessing(false);
    }
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
        className="w-28 h-28 rounded-full border-2 border-dashed border-neutral-300
                   hover:border-accent-500 cursor-pointer flex items-center justify-center
                   overflow-hidden bg-neutral-50 transition"
      >
        {processing ? (
          <span className="text-xs text-neutral-500 text-center px-2">Processing…</span>
        ) : preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-500 text-center px-2">Add photo</span>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChange} />

      {error && <p className="text-xs text-danger-500">{error}</p>}
      <p className="text-xs text-neutral-400">Optional • Any photo — we&apos;ll shrink it</p>
    </div>
  );
}
