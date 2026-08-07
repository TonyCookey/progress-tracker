import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { requireSession, handleApiError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
