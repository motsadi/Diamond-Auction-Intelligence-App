import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'synthetic_auction_data.csv');
    const csv = await readFile(filePath, 'utf-8');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="synthetic_auction_data.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Static dataset not found on server' },
      { status: 500 }
    );
  }
}

