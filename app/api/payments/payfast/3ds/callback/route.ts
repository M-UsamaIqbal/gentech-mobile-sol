import { openPayFast3dsCallbackHtml } from "@/features/inspections/payments/payfast.provider";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy":
    "default-src 'none'; script-src 'unsafe-inline'; sandbox allow-scripts; frame-ancestors 'self'; base-uri 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
};

async function callbackResponse(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const nonce = url.searchParams.get("nonce");
  if (!nonce || nonce.length > 128) {
    return new Response("Invalid payment verification.", {
      status: 400,
      headers: RESPONSE_HEADERS,
    });
  }

  let paRes = url.searchParams.get("PaRes") ?? url.searchParams.get("paRes");
  if (request.method === "POST") {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 16_384) {
      return new Response("Invalid payment verification.", {
        status: 413,
        headers: RESPONSE_HEADERS,
      });
    }
    try {
      const body = await request.formData();
      const submitted = body.get("PaRes") ?? body.get("paRes");
      if (typeof submitted === "string") paRes = submitted;
    } catch {
      return new Response("Invalid payment verification.", {
        status: 400,
        headers: RESPONSE_HEADERS,
      });
    }
  }

  if (!paRes || paRes.length > 12_000) {
    return new Response("Invalid payment verification.", {
      status: 400,
      headers: RESPONSE_HEADERS,
    });
  }

  return new Response(openPayFast3dsCallbackHtml(nonce, paRes), {
    status: 200,
    headers: {
      ...RESPONSE_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export async function GET(request: Request) {
  return callbackResponse(request);
}

export async function POST(request: Request) {
  return callbackResponse(request);
}
