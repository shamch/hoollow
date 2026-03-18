import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // On initial sign-in, `user` only has id/name/email/image from the adapter.
            // We need to fetch the full user from the DB to get custom fields.
            if (user) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.username = dbUser.username;
                    token.role = dbUser.role;
                    token.impactXP = dbUser.impactXP;
                }
            }

            // When the session is explicitly updated (e.g. after profile completion)
            if (trigger === "update" && session) {
                if (session.role) token.role = session.role;
                if (session.impactXP !== undefined) token.impactXP = session.impactXP;
                if (session.name) token.name = session.name;
                if (session.image) token.picture = session.image;
                if (session.user?.image) token.picture = session.user.image;
                if (session.user?.name) token.name = session.user.name;
            }

            // Always refetch impactXP from DB to keep it current
            // (after upvotes, posts, comments etc.)
            if (token.id && !user) {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { impactXP: true, role: true, username: true, image: true, name: true, scheduledDeletionDate: true },
                });
                if (freshUser) {
                    token.impactXP = freshUser.impactXP;
                    token.role = freshUser.role;
                    token.username = freshUser.username;
                    token.picture = freshUser.image;
                    token.name = freshUser.name;
                    token.scheduledDeletionDate = freshUser.scheduledDeletionDate?.toISOString() || null;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.role = token.role as string;
                session.user.impactXP = token.impactXP as number;
                session.user.name = token.name as string;
                session.user.image = token.picture as string;
                session.user.scheduledDeletionDate = token.scheduledDeletionDate as string | null;
            }
            return session;
        },
    },
    pages: {
        signIn: "/onboarding",
        newUser: "/onboarding",
    },
};
