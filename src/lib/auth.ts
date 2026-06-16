import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { verifyAdminCredentials, normalizeEmail } from "@/lib/adminAuth";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Client IP from the NextAuth credentials `req` (a RequestInternal whose
 * `headers` is a plain object, not a Headers instance — so getClientIp from
 * lib/rateLimit, which expects a fetch Request, cannot be reused here).
 * Prefers platform-set, unspoofable headers over client-controllable XFF.
 */
function loginClientIp(headers: Record<string, string | undefined> | undefined): string {
  if (!headers) return "unknown";
  const vercel = headers["x-vercel-forwarded-for"];
  if (vercel) return vercel.split(",")[0].trim();
  const real = headers["x-real-ip"];
  if (real) return real.trim();
  const xff = headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

// Fail fast: never ship a guessable fallback secret/credentials. A committed
// fallback NEXTAUTH_SECRET lets anyone forge admin JWTs, and fallback admin
// creds are public knowledge. Require them to be set in the environment.
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set. Define it in the environment.");
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD are not set. Define them in the environment.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // IP-based login throttle (in addition to the per-account lockout in
        // verifyAdminCredentials): 5 attempts / 10 min per IP. On abuse we throw
        // so NextAuth surfaces an error to the login UI and no credential check
        // runs. (A credentials provider cannot emit a raw 429; the throttle is
        // enforced here — front with a custom route if a true 429 is required.)
        const ip = loginClientIp(req?.headers as Record<string, string | undefined> | undefined);
        const limit = await rateLimit(`login:ip:${ip}`, 5, 10 * 60 * 1000);
        if (!limit.ok) {
          throw new Error("Too many login attempts. Please wait a few minutes and try again.");
        }

        // DB-backed (with one-time env bootstrap) so a reset password takes
        // effect. Existing env credentials keep working until first login.
        await connectToDatabase();
        const ok = await verifyAdminCredentials(credentials.email, credentials.password);
        if (!ok) return null;

        return {
          id: "admin",
          name: "Sugam Clinic Admin",
          email: normalizeEmail(credentials.email),
          role: "admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: NEXTAUTH_SECRET,
};
