import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

// Extend the built-in session types
declare module 'next-auth' {
    interface Session {
        user: {
            id?: string;
        } & DefaultSession['user'];
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (account && user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login', // Custom login page
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
