import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    vercel: process.env.VERCEL ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    buildTime: new Date().toISOString(),
  });
}


