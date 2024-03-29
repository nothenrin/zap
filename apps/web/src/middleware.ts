import { NextResponse, type NextRequest } from "next/server";

const guess = ["/login", "/register", "/"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const headers = new Headers(request.headers);

  if (
    !guess.includes(request.nextUrl.pathname) &&
    !token
  ) {
    return NextResponse.redirect(
      new URL("/login", request.url),
      { headers }
    );
  }

  return NextResponse.next({ headers });
}

export const config = {
  matcher: [
    "/((?!api|_next|_next/image|img|public|favicon.ico).*)",
  ],
};
