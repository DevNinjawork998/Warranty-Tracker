import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("receipt") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const isPdf = file.type === "application/pdf";

  // Upload to Vercel Blob first, then pass the URL to Anthropic — avoids holding
  // the file as both a Buffer and a base64 string simultaneously in memory.
  const blob = await put(`receipts/${session.user.id}/${Date.now()}-${file.name}`, file.stream(), {
    access: "public",
    contentType: file.type,
  });

  const fileContent = isPdf
    ? { type: "document" as const, source: { type: "url" as const, url: blob.url } }
    : { type: "image" as const, source: { type: "url" as const, url: blob.url } };

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          fileContent,
          {
            type: "text",
            text: `You are extracting warranty information from a Malaysian receipt${isPdf ? " PDF" : " photo"}.
Return ONLY valid JSON with these exact fields (use null for anything unclear or not found):
{
  "product_name": string | null,
  "purchase_date": "YYYY-MM-DD" | null,
  "price_myr": number | null,
  "warranty_months": number | null,
  "category": "Electronics" | "Appliance" | "Furniture" | "Automotive" | "Other" | null
}
No explanation, no markdown, just the raw JSON object.`,
          },
        ],
      },
    ],
  });

  let extracted: Record<string, unknown> = {};
  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    extracted = JSON.parse(text.trim());
  } catch {
    // Return empty extraction if parse fails — user will fill in manually
  }

  return NextResponse.json({ ...extracted, receipt_image_url: blob.url });
}
