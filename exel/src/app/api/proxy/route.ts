import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), '/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  const boundary = contentType.split('boundary=')[1];
  
  if (!boundary) {
    return new NextResponse('Content-Type header is missing boundary', { status: 400 });
  }

  const chunks = [];
  const reader = req.body?.getReader();

  if (!reader) {
    return new NextResponse('No stream available', { status: 500 });
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const body = Buffer.concat(chunks);
  const parts = body.toString().split(boundary).slice(1, -1);

  for (const part of parts) {
    const [header, ...rest] = part.trim().split('\r\n\r\n');
    const content = rest.join('\r\n\r\n').trim();
    const nameMatch = header.match(/name="(.+?)"/);
    const filenameMatch = header.match(/filename="(.+?)"/);
    
    if (filenameMatch) {
      const filename = filenameMatch[1];
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, content, 'binary');
      return new NextResponse(JSON.stringify({ message: 'File uploaded successfully', filePath }), { status: 200 });
    }
  }

  return new NextResponse('File upload failed', { status: 500 });
}
