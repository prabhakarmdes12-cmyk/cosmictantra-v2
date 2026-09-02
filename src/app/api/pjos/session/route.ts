import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { IdentityService } from '@/lib/pjos/identity/identityService';
import { PrismaIdentityStore } from '@/lib/pjos/identity/prismaIdentityStore';
import type { BirthDetailsInput } from '@/lib/pjos/identity/types';

const COOKIE_NAME = 'pjos_token';
const ANONYMOUS_SESSION_TTL_DAYS = 30;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as BirthDetailsInput;
    
    let token = cookies().get(COOKIE_NAME)?.value;
    let isNewToken = false;
    
    if (!token) {
      token = crypto.randomBytes(32).toString('base64url');
      isNewToken = true;
    }
    
    const tokenHash = hashToken(token);
    
    const repo = new PrismaIdentityStore(db);
    const identityService = new IdentityService(repo);
    
    // 1. Begin or resume anonymous session
    await identityService.beginAnonymousSession(tokenHash, new Date(), ANONYMOUS_SESSION_TTL_DAYS);
    
    // 2. Record birth details
    const person = await identityService.recordBirthDetails(tokenHash, body);
    
    // 3. Set cookie if it was newly generated
    if (isNewToken) {
      cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ANONYMOUS_SESSION_TTL_DAYS * 24 * 60 * 60,
      });
    }
    
    return NextResponse.json({ success: true, personId: person.id });
  } catch (error: any) {
    console.error('[PJOS_SESSION_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
