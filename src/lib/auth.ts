import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const loginSchema = z.object({
  phone: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔍 STEP 1: Login attempted with phone:", credentials?.phone);

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          console.log("❌ STEP 1 FAILED: Invalid form data", parsed.error.errors);
          return null;
        }

        try {
          console.log("⏳ STEP 2: Connecting to database...");
          const { default: dbConnect } = await import("@/lib/mongodb");
          await dbConnect();
          console.log("✅ STEP 2 SUCCESS: Database connected!");

          const { default: User } = await import("@/models/User");
          const bcrypt = await import("bcryptjs");
          const { phone, password } = parsed.data;

          console.log("⏳ STEP 3: Searching for user in database...");
          const user = await User.findOne({ phone, isActive: true }).lean();
          
          if (!user) {
            console.log("❌ STEP 3 FAILED: No user found with phone:", phone);
            return null;
          }
          console.log("✅ STEP 3 SUCCESS: User found:", user.name);

          console.log("⏳ STEP 4: Checking password...");
          const isMatch = await bcrypt.compare(password, user.passwordHash);
          
          if (!isMatch) {
            console.log("❌ STEP 4 FAILED: Password does not match!");
            return null;
          }
          console.log("✅ STEP 4 SUCCESS: Password matched!");

          console.log("🎉 LOGIN SUCCESSFUL! Returning user to session.");
          return {
            id: user._id.toString(),
            name: user.name,
            phone: user.phone,
            role: user.role,
            businessId: user.businessId.toString(),
          };
        } catch (error) {
          console.error("💥 CRITICAL ERROR IN AUTH:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.businessId = user.businessId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.businessId = token.businessId as string;
      }
      return session;
    },
  },
});