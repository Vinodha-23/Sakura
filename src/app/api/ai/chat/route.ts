import { NextResponse } from "next/server";
import { runNvidiaClinicalChat, type ChatTurn } from "@/lib/nvidia-chat";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body?.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const messages: ChatTurn[] = body.messages
      .filter(
        (m: { role?: string; content?: string }) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .map((m: { role: "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      }));

    if (!messages.length) {
      return NextResponse.json(
        { error: "At least one message is required" },
        { status: 400 }
      );
    }

    let image: { mimeType: string; contentBase64: string } | null = null;
    if (body.image?.contentBase64 && body.image?.mimeType) {
      image = {
        mimeType: String(body.image.mimeType),
        contentBase64: String(body.image.contentBase64),
      };
    }

    const patientId = body.patientId ? String(body.patientId) : null;

    const result = await runNvidiaClinicalChat({
      messages,
      image,
      patientId,
    });
    return NextResponse.json({
      message: {
        role: "assistant",
        content: result.content,
        citations: result.citations,
        reasoningSteps: result.reasoningSteps,
        trustScore: result.trustScore,
        model: result.model,
      },
      scope: {
        patientId: result.scopedPatientId || null,
        patientName: result.scopedPatientName || null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    const status = message.includes("NVIDIA_API_KEY")
      ? 503
      : message.includes("not found")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
