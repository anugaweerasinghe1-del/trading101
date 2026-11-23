import type { CertificateMilestone } from "../../supabase/functions/_shared/foundationsProgramme";

export type DownloadableCertificate = {
  id: string;
  issuedAt: string;
  recipientName: string;
  nameRevision: number;
  verificationActive: boolean;
  milestone: CertificateMilestone;
  templateVersion: string;
  programmeVersion: string;
};

// Original source-rendered backgrounds replace provenance-uncertain historical
// PNG design references. Award records, names, dates and IDs are unchanged.
const templates = {
  "first-course": { title: "FIRST COURSE CERTIFICATE", achievement: "Completion of one course in the Foundations programme" },
  "core-studies": { title: "CORE STUDIES CERTIFICATE", achievement: "Completion of three distinct courses in the Foundations programme" },
  foundations: { title: "FOUNDATIONS COMPLETION CERTIFICATE", achievement: "Completion of all four courses and the required final assessment" },
};
const width = 1536;
const height = 1024;
const scale = 2;
const encoder = new TextEncoder();

function drawBackground(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, milestone: CertificateMilestone) {
  const template = templates[milestone];
  ctx.fillStyle = "#fbfdfc";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#147d72";
  ctx.lineWidth = 6;
  ctx.strokeRect(38, 38, width - 76, height - 76);
  ctx.strokeStyle = "#beddd5";
  ctx.lineWidth = 2;
  ctx.strokeRect(57, 57, width - 114, height - 114);
  ctx.fillStyle = "#e3f3ee";
  ctx.beginPath();ctx.moveTo(40, 40);ctx.lineTo(400, 40);ctx.lineTo(40, 270);ctx.closePath();ctx.fill();
  ctx.drawImage(logo, 156, 112, 96, 96);
  ctx.textAlign = "left";
  ctx.fillStyle = "#123d36";
  ctx.font = "bold 52px Arial, sans-serif";
  ctx.fillText("TradeHQ", 276, 177);
  // Decorative, source-authored candles, not observed or forecast market data.
  for (let i = 0; i < 5; i++) {
    const x = 1130 + i * 40, y = 205 - i * 20;
    ctx.strokeStyle = "#399e89";ctx.lineWidth = 3;
    ctx.beginPath();ctx.moveTo(x, y - 35);ctx.lineTo(x, y + 40);ctx.stroke();
    ctx.fillStyle = "#6fbca6";ctx.fillRect(x - 11, y - 10, 22, 34);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#12665d";
  fitText(ctx, template.title, "Arial, sans-serif", 48, 1310, 768, 308);
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText("FOUNDATIONS PROGRAMME · PERSONAL LEARNING RECORD", 768, 366);
  ctx.fillStyle = "#344a45";ctx.font = "30px Georgia, serif";
  ctx.fillText("Presented to", 768, 443);
  ctx.strokeStyle = "#bdd8cf";ctx.lineWidth = 2;
  ctx.beginPath();ctx.moveTo(263, 601);ctx.lineTo(1273, 601);ctx.stroke();
  fitText(ctx, template.achievement, "Georgia, serif", 30, 1290, 768, 666);
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("Educational completion only · not an accredited qualification", 768, 720);
  ctx.fillText("Not evidence of investment expertise, trading skill or real-market performance", 768, 755);
  ctx.fillStyle = "#12665d";ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("ISSUE DATE", 385, 828);ctx.fillText("CERTIFICATE ID", 1170, 828);
  ctx.fillStyle = "#dcefe7";ctx.strokeStyle = "#147d72";ctx.lineWidth = 4;
  ctx.beginPath();ctx.arc(768, 858, 65, 0, Math.PI * 2);ctx.fill();ctx.stroke();
  ctx.drawImage(logo, 736, 826, 64, 64);
  ctx.fillStyle = "#50665f";ctx.font = "19px Arial, sans-serif";
  ctx.fillText("TradeHQ · thetradehq.com", 768, 960);
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

function picturePdf(jpeg: ArrayBuffer, textAlternative: string): Blob {
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
  // Hex-encoded UTF-16 prevents PDF syntax injection and retains script names.
  let actualText = "FEFF";
  for (let i = 0; i < textAlternative.length; i++) actualText += textAlternative.charCodeAt(i).toString(16).padStart(4, "0");
  const command = "q\n841.89 0 0 561.26 0 17.01 cm\n/Artwork Do\nQ\n"
    + "/Span << /ActualText <" + actualText + "> >> BDC\n"
    + "BT /F1 12 Tf 3 Tr 60 540 Td (Certificate text) Tj ET\nEMC\n";
  add("%PDF-1.4\n%\u00c2\u00a5\u00c2\u00a5\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] "
    + "/Resources << /XObject << /Artwork 4 0 R >> /Font << /F1 6 0 R >> >> /Contents 5 0 R >>");
  object(4, "<< /Type /XObject /Subtype /Image /Width " + width * scale
    + " /Height " + height * scale + " /ColorSpace /DeviceRGB /BitsPerComponent 8"
    + " /Filter /DCTDecode /Length " + jpeg.byteLength + " >>", jpeg);
  const commands = encoder.encode(command);
  object(5, "<< /Length " + commands.byteLength + " >>", commands.buffer);
  object(6, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const xref = position;
  add("xref\n0 7\n0000000000 65535 f \n");
  for (const offset of offsets.slice(1)) add(String(offset).padStart(10, "0") + " 00000 n \n");
  add("trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
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
  const logo = new Image();
  logo.src = "/logo.svg";
  const [font] = await Promise.all([recipientFont(recipientName), logo.decode()]);
  if (!logo.naturalWidth || !logo.naturalHeight) throw Error("TradeHQ brand artwork is unavailable.");

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw Error("Certificate rendering is unavailable.");
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = "high";
  drawBackground(ctx, logo, milestone);
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
  const textAlternative = ["TradeHQ", templates[milestone].title, "Presented to " + recipientName,
    templates[milestone].achievement, "Issue date: " + date, "Certificate ID: " + id.toUpperCase(),
    "Educational completion only, not an accredited qualification.",
    "Not evidence of investment expertise, trading skill or real-market performance."].join("\n");
  return picturePdf(await jpeg.arrayBuffer(), textAlternative);
}
