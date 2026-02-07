import { useEffect, useState } from "react";

type Props = {
  imageKey?: string | null;
  alt?: string;
  size?: number;
};

export default function LieutenantAvatar({ imageKey, alt = "Lieutenant", size = 80 }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageKey) return;

    async function fetchSignedUrl() {
      try {
        const res = await fetch("/api/lieutenants/get-image-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: imageKey }),
        });

        const data = await res.json();
        if (data.url) setUrl(data.url);
      } catch (err) {
        console.error("Failed to get signed URL", err);
      }
    }

    fetchSignedUrl();
  }, [imageKey]);

  if (!imageKey) {
    return (
      <div className={`rounded-full bg-gray-200 flex items-center justify-center text-gray-500`} style={{ width: size, height: size }}>
        ?
      </div>
    );
  }

  if (!url) {
    return <div className={`rounded-full bg-gray-100 animate-pulse`} style={{ width: size, height: size }}></div>;
  }

  return <img src={url} alt={alt} className="rounded-full object-cover" style={{ width: size, height: size }} />;
}
