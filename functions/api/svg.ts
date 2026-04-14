import { generateAlevSvg } from "../../docs/lib/alev-svg";
import { ZodError } from "zod";

export const onRequestGet = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  let svg: string;

  try {
    svg = generateAlevSvg({
      text: params.t ?? "",
      fontSize: params.fs,
      letterSpacing: params.ls,
      color: params.c,
      shadowColor: params.sc,
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: error instanceof ZodError ? 400 : 500 },
    );
  }

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
