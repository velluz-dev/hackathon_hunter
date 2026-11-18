import Link from "next/link";
import { InboxIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
        <InboxIcon size={22} />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">Not listed anymore</h1>
      <p className="mt-2 text-sm text-zinc-500">
        This hackathon has ended or was taken down by its site. If you saved it, it&apos;s still on your Saved board.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
          Browse hackathons
        </Link>
        <Link href="/saved" className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Saved
        </Link>
      </div>
    </div>
  );
}
