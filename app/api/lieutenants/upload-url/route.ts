import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const { lieutenantId, fileType } = await req.json();

  if (!lieutenantId) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const key = `lieutenant/${lieutenantId}/${nanoid()}.jpg`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: fileType,
  });

  const url = await getSignedUrl(r2, command, { expiresIn: 60 });

  return NextResponse.json({ url, key });
}
