import type { CertificateMilestone } from "../../supabase/functions/_shared/foundationsProgramme";

export type DownloadableCertificate = {
  id: string;
  issuedAt: string;
  recipientName: string;
  milestone: CertificateMilestone;
  templateVersion: string;
  programmeVersion: string;
};

const templates = {
  "first-course": new URL("../../docs/phase5/first-course-certificate-preview.png", import.meta.url).href,
  "core-studies": new URL("../../docs/phase5/core-studies-certificate-preview.png", import.meta.url).href,
  foundations: new URL("../../docs/phase5/foundations-certificate-preview.png", import.meta.url).href,
};
const width = 1536;
const height = 1024;
const scale = 2;
const encoder = new TextEncoder();

function removeSampleText(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // The approved files are retained verbatim. Restore only the darker sample
  // glyphs in the three variable fields from the adjacent background colours.
  const region = ctx.getImageData(x, y, w, h);
  const pixels = region.data;
  for (let row = 1; row < h - 1; row++) {
    const weight = row / (h - 1);
    for (let column = 0; column < w; column++) {
      const start = column * 4;
      const end = ((h - 1) * w + column) * 4;
      const index = (row * w + column) * 4;
      const background = [
        pixels[start] * (1 - weight) + pixels[end] * weight,
        pixels[start + 1] * (1 - weight) + pixels[end + 1] * weight,
        pixels[start + 2] * (1 - weight) + pixels[end + 2] * weight,
      ];
      const difference = background.reduce((sum, channel, i) => sum + channel - pixels[index + i], 0);
      if (difference > 2) {
        pixels.set(background, index);
      }
    }
  }
  ctx.putImageData(region, x, y);
}

function fitText(ctx: CanvasRenderingContext2D, value: string, family: string, maxSize: number,
  maxWidth: number, x: number, y: number) {
  let size = maxSize;
  ctx.font = size + "px " + family;
  while (ctx.measureText(value).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = size + "px " + family;
  }
  ctx.fillText(value, x, y, maxWidth);
}

function picturePdf(jpeg: ArrayBuffer): Blob {
  const parts: BlobPart[] = [];
  const offsets = [0];
  let position = 0;
  const add = (part: string | ArrayBuffer) => {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    parts.push(bytes);
    position += bytes.byteLength;
  };
  const object = (number: number, body: string, stream?: ArrayBuffer) => {
    offsets[number] = position;
    add(number + " 0 obj\n" + body);
    if (stream) {
      add("\nstream\n");
      add(stream);
      add("\nendstream");
    }
    add("\nendobj\n");
  };
  const command = "q\n841.89 0 0 561.26 0 17.01 cm\n/Artwork Do\nQ\n";
  add("%PDF-1.4\n%\u00c2\u00a5\u00c2\u00a5\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] "
    + "/Resources << /XObject << /Artwork 4 0 R >> >> /Contents 5 0 R >>");
  object(4, "<< /Type /XObject /Subtype /Image /Width " + width * scale
    + " /Height " + height * scale + " /ColorSpace /DeviceRGB /BitsPerComponent 8"
    + " /Filter /DCTDecode /Length " + jpeg.byteLength + " >>", jpeg);
  const commands = encoder.encode(command);
  object(5, "<< /Length " + commands.byteLength + " >>", commands.buffer);
  const xref = position;
  add("xref\n0 6\n0000000000 65535 f \n");
  for (const offset of offsets.slice(1)) add(String(offset).padStart(10, "0") + " 00000 n \n");
  add("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  return new Blob(parts, { type: "application/pdf" });
}

const localFonts = [
  { pattern: /\p{Script=Sinhala}/u, family: "TradeHQ Sinhala", url: "/achievements/fonts/sinhala.woff2" },
  { pattern: /\p{Script=Tamil}/u, family: "TradeHQ Tamil", url: "/achievements/fonts/tamil.woff2" },
];
const loadingFonts = new Map<string, Promise<void>>();

async function recipientFont(name: string) {
  const matching = localFonts.filter(({ pattern }) => pattern.test(name));
  await Promise.all(matching.map(({ family, url }) => {
    const existing = loadingFonts.get(family);
    if (existing) return existing;
    const loading = new FontFace(family, "url(" + url + ")").load()
      .then(face => { document.fonts.add(face); })
      .catch(error => { loadingFonts.delete(family); throw error; });
    loadingFonts.set(family, loading);
    return loading;
  }));
  return [...matching.map(({ family }) => '"' + family + '"'), 'Georgia', '"Times New Roman"', 'serif'].join(", ");
}

export async function renderFoundationsCertificatePdf(certificate: DownloadableCertificate) {
  const { id, issuedAt, recipientName, milestone, templateVersion, programmeVersion } = certificate;
  const issuedDate = new Date(issuedAt);
  if (!Object.prototype.hasOwnProperty.call(templates, milestone) || templateVersion !== "trade-hq-white-teal-v1"
      || programmeVersion !== "foundations-v1" || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)
      || !recipientName || [...recipientName].length > 100 || !Number.isFinite(issuedDate.getTime())) {
    throw Error("Certificate details are unavailable.");
  }
  const art = new Image();
  art.src = templates[milestone];
  const [font] = await Promise.all([recipientFont(recipientName), art.decode()]);
  if (art.naturalWidth !== width || art.naturalHeight !== height) throw Error("Certificate artwork is unavailable.");

  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const original = source.getContext("2d", { willReadFrequently: true });
  if (!original) throw Error("Certificate rendering is unavailable.");
  original.drawImage(art, 0, 0);
  removeSampleText(original, 488, 485, 562, 113);
  removeSampleText(original, 278, 848, 222, 37);
  removeSampleText(original, 1037, 848, 224, 37);

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw Error("Certificate rendering is unavailable.");
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#090d14";
  ctx.font = "52px " + font;
  const words = recipientName.split(/\s+/u);
  if (ctx.measureText(recipientName).width > 1010 && words.length > 1) {
    const middle = Math.ceil(words.length / 2);
    fitText(ctx, words.slice(0, middle).join(" "), font, 45, 1010, 768, 526);
    fitText(ctx, words.slice(middle).join(" "), font, 45, 1010, 768, 577);
  } else {
    fitText(ctx, recipientName, font, 104, 1010, 768, 568);
  }
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo", day: "numeric", month: "long", year: "numeric",
  }).format(issuedDate);
  fitText(ctx, date, "Arial, sans-serif", 24, 245, 385, 876);
  fitText(ctx, id.toUpperCase(), "Arial, sans-serif", 20, 325, 1170, 876);

  const jpeg = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(Error("Certificate image encoding failed.")), "image/jpeg", 0.96);
  });
  return picturePdf(await jpeg.arrayBuffer());
}
