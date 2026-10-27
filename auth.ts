import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;

      const email = profile?.email?.toLowerCase();
      if (!email || !profile?.email_verified) return false;

      // Owner: dibuat otomatis dari OWNER_EMAIL, tidak bisa lewat UI
      const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
      if (ownerEmail && email === ownerEmail) {
        await db
          .insert(users)
          .values({
            email,
            name: profile.name ?? null,
            role: "owner",
            active: 1,
          })
          .onConflictDoUpdate({
            target: users.email,
            set: { role: "owner", active: 1, name: profile.name ?? null },
          });
        return true;
      }

      // Selain owner: harus sudah ditambahkan owner dan masih aktif
      const [user] = await db
        .select({ active: users.active, name: users.name })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || user.active !== 1) return false;

      // Isi nama dari Google kalau owner belum mengisinya
      if (!user.name && profile.name) {
        await db.update(users).set({ name: profile.name }).where(eq(users.email, email));
      }
      return true;
    },
  },
});
