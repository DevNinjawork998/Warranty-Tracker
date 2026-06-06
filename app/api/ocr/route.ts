import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function detectMime(buf: Buffer): string | null {
	if (buf.length < 4) return null;
	if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
	if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
		return "image/png";
	if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
	if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)
		return "application/pdf";
	if (
		buf.length >= 12 &&
		buf[0] === 0x52 &&
		buf[1] === 0x49 &&
		buf[2] === 0x46 &&
		buf[3] === 0x46 &&
		buf[8] === 0x57 &&
		buf[9] === 0x45 &&
		buf[10] === 0x42 &&
		buf[11] === 0x50
	)
		return "image/webp";
	return null;
}

const ALLOWED_MIMES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
];

export async function POST(req: Request) {
	try {
		const session = await getSession();
		if (!session?.user?.id)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const formData = await req.formData();
		const file = formData.get("receipt") as File | null;
		if (!file)
			return NextResponse.json({ error: "No file provided" }, { status: 400 });

		// H2: reject before reading into memory
		if (file.size > MAX_BYTES) {
			return NextResponse.json(
				{ error: "File too large (max 10 MB)" },
				{ status: 413 },
			);
		}

		// Read once, reuse buffer for Blob upload and base64 payload for Anthropic.
		const fileBytes = Buffer.from(await file.arrayBuffer());
		const base64Data = fileBytes.toString("base64");

		// H3: validate actual file content, not client-supplied MIME
		const detectedMime = detectMime(fileBytes);
		if (!detectedMime || !ALLOWED_MIMES.includes(detectedMime)) {
			return NextResponse.json(
				{ error: "Unsupported file type" },
				{ status: 415 },
			);
		}
		const isPdf = detectedMime === "application/pdf";

		// L2: sanitize filename before using in storage path
		const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

		const blob = await put(
			`receipts/${session.user.id}/${Date.now()}-${safeName}`,
			fileBytes,
			{
				access: "private",
				contentType: detectedMime,
			},
		);

		const fileContent = isPdf
			? {
					type: "document" as const,
					source: {
						type: "base64" as const,
						media_type: "application/pdf" as const,
						data: base64Data,
					},
				}
			: {
					type: "image" as const,
					source: {
						type: "base64" as const,
						media_type: detectedMime as
							| "image/jpeg"
							| "image/png"
							| "image/gif"
							| "image/webp",
						data: base64Data,
					},
				};

		const message = await anthropic.messages.create({
			model: process.env.OCR_MODEL ?? "claude-sonnet-4-6",
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
  "store_name": string | null,
  "purchase_date": "YYYY-MM-DD" | null,
  "price_myr": number | null,
  "warranty_months": number | null,
  "category": "Electronics" | "Appliance" | "Furniture" | "Automotive" | "Other" | null,
  "serial_number": string | null
}
No explanation, no markdown, just the raw JSON object.`,
						},
					],
				},
			],
		});

		let extracted: Record<string, unknown> = {};
		try {
			const text =
				message.content[0].type === "text" ? message.content[0].text : "";
			// Haiku sometimes wraps output in markdown code fences or adds preamble text.
			// Extract the first JSON object from the response regardless of surrounding content.
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
		} catch {
			console.error("[OCR] JSON parse failed — returning empty extraction");
		}

		return NextResponse.json({ ...extracted, receipt_image_url: blob.url });
	} catch (err) {
		console.error("[OCR] error:", err);
		// M4: don't leak internal error details to the client
		return NextResponse.json(
			{ error: "OCR processing failed" },
			{ status: 500 },
		);
	}
}
