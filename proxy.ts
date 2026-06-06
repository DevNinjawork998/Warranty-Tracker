import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED = ["/dashboard", "/upload", "/settings"];

export default auth((req) => {
	// Auth bypass for local development — set BYPASS_AUTH=true in .env.local
	if (process.env.BYPASS_AUTH === "true") return NextResponse.next();

	const { pathname } = req.nextUrl;
	const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

	if (isProtected && !req.auth) {
		const loginUrl = new URL("/auth/login", req.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	if (req.auth && (pathname === "/auth/login" || pathname === "/auth/signup")) {
		return NextResponse.redirect(new URL("/dashboard", req.url));
	}
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
