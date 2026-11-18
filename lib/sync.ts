// Moves a saved list to another device without a server: the list is compressed into the
// link's #fragment, which browsers never send to the server. Anyone with the link can read it.

const MAX_BYTES = 5_000_000;

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Runs bytes through a (de)compression stream, giving up past MAX_BYTES so a crafted link can't eat memory. */
async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(transform).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Sync link is too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

const canCompress = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

/** "z" + deflated JSON, or "j" + plain JSON where the browser can't compress. */
export async function encodeSync(data: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(data));
  return canCompress() ? `z${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}` : `j${toBase64Url(json)}`;
}

export async function decodeSync(code: string): Promise<unknown> {
  const bytes = fromBase64Url(code.slice(1));
  let raw: Uint8Array;
  if (code[0] === "z") {
    if (!canCompress()) throw new Error("This browser can't open sync links; use Export and Import instead");
    raw = await pipe(bytes, new DecompressionStream("deflate-raw"));
  } else if (code[0] === "j") {
    raw = bytes;
  } else {
    throw new Error("Not a Hackathon Hunter sync link");
  }
  return JSON.parse(new TextDecoder().decode(raw));
}
