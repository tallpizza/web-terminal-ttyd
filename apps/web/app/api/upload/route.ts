import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get('file') as File | null;
  if (!file) return NextResponse.json({ ok: false }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.env.HOME || '/tmp', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, file.name);
  fs.writeFileSync(filePath, buffer);
  return NextResponse.json({ ok: true, savedPath: `~/uploads/${file.name}` });
}
