"use client";

import { useEffect, useRef } from "react";

/**
 * A button to drag to the bookmarks bar. Clicked on a Facebook (or any) post, it opens Saved
 * with the post's link and the selected text (or the page's description) filled into
 * "Add from link". React refuses javascript: links in props, so the href is set directly.
 */
export function Bookmarklet() {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const target = `${window.location.origin}/saved#add?`;
    const code =
      "javascript:(()=>{var s=String(getSelection()||'').trim(),m=document.querySelector('meta[property=\"og:description\"]')," +
      "t=(s||(m&&m.content)||'').slice(0,2500);" +
      `window.open('${target}url='+encodeURIComponent(location.href)+'&text='+encodeURIComponent(t),'_blank')})()`;
    ref.current?.setAttribute("href", code);
  }, []);
  return (
    <a
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        alert("Drag this button to your bookmarks bar, then click it on a Facebook post.");
      }}
      className="inline-flex h-9 cursor-grab items-center gap-1.5 rounded-lg bg-[#1877f2] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0b5fcc] active:cursor-grabbing"
      title="Drag me to your bookmarks bar"
    >
      ＋ Hackathon Hunter
    </a>
  );
}
