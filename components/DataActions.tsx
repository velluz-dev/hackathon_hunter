"use client";

import { useRef } from "react";
import { DownloadIcon, UploadIcon } from "./icons";
import { btnGhost } from "@/lib/ui";
import { useTracker } from "@/lib/useTracker";

/** Downloads saved hackathons as JSON, to back up or move to another browser. */
export function ExportButton() {
  const { tracked } = useTracker();
  const empty = Object.keys(tracked).length === 0;

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(tracked, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "hackathon-hunter-saved.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={exportJson} disabled={empty} className={btnGhost}>
      <DownloadIcon size={16} />
      Export
    </button>
  );
}

/** Merges a file made by ExportButton into the saved list. */
export function ImportButton() {
  const { importData } = useTracker();
  const fileRef = useRef<HTMLInputElement>(null);

  const importJson = async (file: File) => {
    try {
      if (file.size > 5_000_000) throw new Error();
      const data = JSON.parse(await file.text());
      if (importData(data) === 0) throw new Error();
    } catch {
      alert("That file doesn't look like a Hackathon Hunter export.");
    }
  };

  return (
    <>
      <button onClick={() => fileRef.current?.click()} className={btnGhost}>
        <UploadIcon size={16} />
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importJson(f);
          e.target.value = "";
        }}
      />
    </>
  );
}
