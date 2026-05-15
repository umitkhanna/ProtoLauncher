import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    parentClientId?: string | null;
    image?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: string;
      parentClientId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    parentClientId?: string | null;
  }
}
