import { NextRequest, NextResponse } from "next/server";

const OPENPANEL_API_URL = "https://analytics-api.laytonberth.com";

function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, the first one is the client
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Coolify/Traefik might use these
  const trueClientIp = request.headers.get("true-client-ip");
  if (trueClientIp) {
    return trueClientIp;
  }

  // Fallback - this will be the proxy IP if nothing else is available
  return request.headers.get("x-forwarded-for") || "unknown";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path?.join("/") || "";
  const clientIp = getClientIp(request);

  try {
    const body = await request.text();

    const response = await fetch(`${OPENPANEL_API_URL}/${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type":
          request.headers.get("content-type") || "application/json",
        // Forward the real client IP to OpenPanel
        "X-Forwarded-For": clientIp,
        "X-Real-IP": clientIp,
        "True-Client-IP": clientIp,
        // Forward user agent for device detection
        "User-Agent": request.headers.get("user-agent") || "",
        // Forward accept-language for locale detection
        "Accept-Language": request.headers.get("accept-language") || "",
      },
      body,
    });

    const responseData = await response.text();

    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("OpenPanel proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path?.join("/") || "";
  const clientIp = getClientIp(request);

  try {
    const response = await fetch(`${OPENPANEL_API_URL}/${pathname}`, {
      method: "GET",
      headers: {
        "X-Forwarded-For": clientIp,
        "X-Real-IP": clientIp,
        "True-Client-IP": clientIp,
        "User-Agent": request.headers.get("user-agent") || "",
        "Accept-Language": request.headers.get("accept-language") || "",
      },
    });

    const responseData = await response.text();

    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("OpenPanel proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request" },
      { status: 500 }
    );
  }
}
