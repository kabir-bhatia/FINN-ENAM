// PNG app icons for the web manifest (192 and 512 px).
import { appIcon } from "@/lib/appicon";

export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  const px = size === "512" ? 512 : 192;
  const img = appIcon(px);
  return new Response(img.body, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800, immutable" },
  });
}
