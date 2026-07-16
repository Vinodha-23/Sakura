import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { importPatientsFromCsv } from "@/lib/patients";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let csvText = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }
    if (file.size > 2_000_000) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }
    csvText = await file.text();
  } else {
    const body = await request.json().catch(() => null);
    if (body?.useSample) {
      const samplePath = path.join(process.cwd(), "public", "samples", "patients-sample.csv");
      csvText = await readFile(samplePath, "utf8");
    } else if (typeof body?.csv === "string") {
      csvText = body.csv;
    } else {
      return NextResponse.json(
        { error: "Provide a CSV file, csv text, or useSample: true" },
        { status: 400 }
      );
    }
  }

  const result = await importPatientsFromCsv(csvText, {
    doctorName: session.user.name,
    doctorId: session.user.id,
  });

  return NextResponse.json({
    ok: true,
    ...result,
    message: `Imported ${result.imported} new, updated ${result.updated}, skipped ${result.skipped}. Generated ${result.alertsCreated} safety alerts.`,
  });
}
