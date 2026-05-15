import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { resolveGoogleSignIn } from "@/lib/auth-google";
import { isGoogleAuthConfigured } from "@/lib/google-auth-config";
import { getUserByEmail } from "@/lib/users";

function mapDbUserToSessionUser(row) {
  return {
    id: String(row.id),
    email: row.email,
    name: row.name ?? undefined,
    role: row.role ?? "client",
    parentClientId:
      row.parent_client_id != null ? String(row.parent_client_id) : null,
    image: row.avatar_url ?? undefined,
  };
}

const providers = [
  Credentials({
    id: "credentials",
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;
      if (!email || !password) return null;

      const user = await getUserByEmail(String(email));
      if (!user?.password_hash) return null;

      const ok = await bcrypt.compare(String(password), user.password_hash);
      if (!ok) return null;

      return mapDbUserToSessionUser(user);
    },
  }),
];

if (isGoogleAuthConfigured()) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      if (!user.email) return false;

      try {
        const dbUser = await resolveGoogleSignIn({
          email: user.email,
          name: user.name,
          image: user.image,
          googleSub: account.providerAccountId,
        });
        const mapped = mapDbUserToSessionUser(dbUser);
        user.id = mapped.id;
        user.role = mapped.role;
        user.parentClientId = mapped.parentClientId;
        user.name = mapped.name;
        user.image = mapped.image;
        return true;
      } catch (err) {
        const msg = String(err?.message ?? err);
        if (msg === "OAUTH_ACCOUNT_CONFLICT") {
          return "/login?error=OAuthAccountNotLinked";
        }
        console.error("google signIn", err);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role ?? "client";
        token.parentClientId = user.parentClientId ?? null;
        token.authProvider = account?.provider ?? "credentials";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        if (token.email) session.user.email = token.email;
        if (token.name !== undefined) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture;
        session.user.role = token.role ?? "client";
        session.user.parentClientId = token.parentClientId ?? null;
      }
      return session;
    },
  },
});
