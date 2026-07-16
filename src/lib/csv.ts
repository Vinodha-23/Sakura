/** Lightweight CSV helpers for Synthea-style patient imports (no paid deps). */

export function parseCsv(text: string): Record<string, string>[] {
  const rows = splitCsvRows(text.trim().replace(/^\uFEFF/, ""));
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => normalizeHeader(h));
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = (cols[i] ?? "").trim();
    });
    return obj;
  });
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/** Split CSV text into rows of fields, supporting quotes and commas. */
function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // ignore
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function splitPipeList(value?: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ageFromDob(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return Math.max(0, age);
}
