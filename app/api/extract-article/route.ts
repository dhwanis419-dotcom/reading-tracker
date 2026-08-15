import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ title: null, site: null }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ReadingTracker/1.0)' },
    });
    const html = await res.text();

    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogSiteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);

    const title = ogTitleMatch?.[1] || titleTagMatch?.[1] || null;
    const site = ogSiteMatch?.[1] || new URL(url).hostname.replace(/^www\./, '');

    return NextResponse.json({ title: title?.trim() || null, site });
  } catch {
    return NextResponse.json({ title: null, site: null });
  }
}
