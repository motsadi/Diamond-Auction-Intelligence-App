// Some browsers request `/favicon.ico` automatically.
// Serve a tiny valid `.ico` so we don't get noisy 404s in production.
export function GET() {
  // Minimal 1x1, 32bpp, opaque white ICO (70 bytes total).
  // Format: ICONDIR (6) + ICONDIRENTRY (16) + BITMAPINFOHEADER (40) + XOR (4) + AND mask (4)
  const bytes = new Uint8Array([
    // ICONDIR
    0x00, 0x00, // reserved
    0x01, 0x00, // type = icon
    0x01, 0x00, // count = 1

    // ICONDIRENTRY
    0x01, // width = 1
    0x01, // height = 1
    0x00, // color count
    0x00, // reserved
    0x01, 0x00, // planes
    0x20, 0x00, // bit count = 32
    0x30, 0x00, 0x00, 0x00, // bytes in res = 48
    0x16, 0x00, 0x00, 0x00, // image offset = 22

    // BITMAPINFOHEADER (40 bytes)
    0x28, 0x00, 0x00, 0x00, // biSize = 40
    0x01, 0x00, 0x00, 0x00, // biWidth = 1
    0x02, 0x00, 0x00, 0x00, // biHeight = 2 (XOR + AND)
    0x01, 0x00, // biPlanes = 1
    0x20, 0x00, // biBitCount = 32
    0x00, 0x00, 0x00, 0x00, // biCompression = BI_RGB
    0x00, 0x00, 0x00, 0x00, // biSizeImage
    0x00, 0x00, 0x00, 0x00, // biXPelsPerMeter
    0x00, 0x00, 0x00, 0x00, // biYPelsPerMeter
    0x00, 0x00, 0x00, 0x00, // biClrUsed
    0x00, 0x00, 0x00, 0x00, // biClrImportant

    // XOR bitmap (1 pixel, BGRA) - white, opaque
    0xff, 0xff, 0xff, 0xff,

    // AND mask (1 row, padded to 32 bits) - 0 = opaque
    0x00, 0x00, 0x00, 0x00,
  ]);

  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}


