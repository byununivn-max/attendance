import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    // Protect all routes except the login page, API routes, and static Next.js internal files
    matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
