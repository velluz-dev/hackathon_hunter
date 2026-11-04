"use client";

import { useEffect, useId, useRef } from "react";
import { XIcon } from "./icons";
import { iconButton, iconIdle } from "@/lib/ui";

/**
 * Native <dialog> modal: focus trap, Escape and the backdrop come from the browser.
 * The element marked data-autofocus gets focus when it opens.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the dialog element itself (not its content) is a click on the backdrop.
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={`${id}-title`}
      className="modal rounded-2xl border border-line bg-surface p-0 text-zinc-100 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm leading-relaxed text-zinc-400">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className={`${iconButton} ${iconIdle} -mr-2 -mt-1`}>
            <XIcon size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
