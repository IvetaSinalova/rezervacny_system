import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const DEFAULT_WORDPRESS_URL = "https://psiaskola.sk";

async function proxyWordPressRequest(request, context) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (!process.env.WP_API_SECRET) {
    return NextResponse.json(
      { message: "WP_API_SECRET is not configured" },
      { status: 500 },
    );
  }

  const params = await context.params;
  const wpPath = params.path.join("/");
  const incomingUrl = new URL(request.url);
  const wpBaseUrl = process.env.WORDPRESS_URL || DEFAULT_WORDPRESS_URL;
  const wpUrl = new URL(`/wp-json/${wpPath}`, wpBaseUrl);
  wpUrl.search = incomingUrl.search;

  const headers = {
    Accept: "application/json",
    "X-Psia-Admin-Secret": process.env.WP_API_SECRET,
  };

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const init = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  const wpResponse = await fetch(wpUrl, init);
  const responseBody = await wpResponse.text();

  return new NextResponse(responseBody, {
    status: wpResponse.status,
    headers: {
      "Content-Type":
        wpResponse.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = proxyWordPressRequest;
export const POST = proxyWordPressRequest;
export const PUT = proxyWordPressRequest;
export const PATCH = proxyWordPressRequest;
export const DELETE = proxyWordPressRequest;
