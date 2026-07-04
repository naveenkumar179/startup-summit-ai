import * as client from "openid-client";
import { eq } from "drizzle-orm";
import { useSession, getRequestHeader, getRequestHost } from "@tanstack/react-start/server";

import { db } from "./db";
import { users, type User } from "./db/schema";

const REPLIT_DOMAINS = (process.env.REPLIT_DOMAINS ?? "").split(",").filter(Boolean);

let configPromise: Promise<client.Configuration> | undefined;

function getOidcConfig() {
  if (!configPromise) {
    configPromise = client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  }
  return configPromise;
}

type AuthSessionData = {
  claims?: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    exp?: number;
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  oauth_state?: string;
  oauth_code_verifier?: string;
  oauth_redirect_uri?: string;
};

export function getAuthSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not set");
  }
  return useSession<AuthSessionData>({
    password: process.env.SESSION_SECRET,
    name: "startupbridge_session",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { secure: true, httpOnly: true, sameSite: "lax", path: "/" },
  });
}

function getCurrentUrl(): URL {
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHost();
  return new URL(`${proto}://${host}`);
}

export async function buildLoginRedirectUrl(): Promise<{ url: string; session: Awaited<ReturnType<typeof getAuthSession>> }> {
  const config = getOidcConfig();
  const resolvedConfig = await config;
  const session = await getAuthSession();

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();

  const redirectUri = new URL("/api/callback", getCurrentUrl()).toString();

  await session.update({
    oauth_state: state,
    oauth_code_verifier: codeVerifier,
    oauth_redirect_uri: redirectUri,
  });

  const authUrl = client.buildAuthorizationUrl(resolvedConfig, {
    redirect_uri: redirectUri,
    scope: "openid email profile offline_access",
    prompt: "login consent",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return { url: authUrl.href, session };
}

export async function handleAuthCallback(requestUrl: URL): Promise<{ success: boolean }> {
  const session = await getAuthSession();
  const { oauth_state, oauth_code_verifier, oauth_redirect_uri } = session.data;

  if (!oauth_state || !oauth_code_verifier || !oauth_redirect_uri) {
    return { success: false };
  }

  const config = await getOidcConfig();

  const tokens = await client.authorizationCodeGrant(config, requestUrl, {
    expectedState: oauth_state,
    pkceCodeVerifier: oauth_code_verifier,
    idTokenExpected: true,
  });

  const claims = tokens.claims();
  if (!claims) {
    return { success: false };
  }

  await upsertUser({
    id: String(claims.sub),
    email: (claims.email as string) ?? null,
    firstName: (claims.first_name as string) ?? null,
    lastName: (claims.last_name as string) ?? null,
    profileImageUrl: (claims.profile_image_url as string) ?? null,
  });

  await session.update({
    claims: {
      sub: String(claims.sub),
      email: claims.email as string | undefined,
      first_name: claims.first_name as string | undefined,
      last_name: claims.last_name as string | undefined,
      profile_image_url: claims.profile_image_url as string | undefined,
      exp: claims.exp,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: claims.exp,
    oauth_state: undefined,
    oauth_code_verifier: undefined,
    oauth_redirect_uri: undefined,
  });

  return { success: true };
}

export async function getEndSessionUrl(): Promise<string> {
  const config = await getOidcConfig();
  const currentUrl = getCurrentUrl();
  return client.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: currentUrl.toString(),
  }).href;
}

async function upsertUser(user: {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}) {
  await db
    .insert(users)
    .values(user)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        updatedAt: new Date(),
      },
    });
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getAuthSession();
  const sub = session.data.claims?.sub;
  if (!sub) return null;

  const [user] = await db.select().from(users).where(eq(users.id, sub));
  return user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return user;
}

export { REPLIT_DOMAINS };
