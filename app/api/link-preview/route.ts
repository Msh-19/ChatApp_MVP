import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the page
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL' },
        { status: response.status }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract Open Graph tags or fallback to standard meta tags
    const getMetaContent = (property: string): string | null => {
      return (
        $(`meta[property="${property}"]`).attr('content') ||
        $(`meta[name="${property}"]`).attr('content') ||
        null
      )
    }

    const title =
      getMetaContent('og:title') ||
      getMetaContent('twitter:title') ||
      $('title').text() ||
      validUrl.hostname

    const description =
      getMetaContent('og:description') ||
      getMetaContent('twitter:description') ||
      getMetaContent('description') ||
      ''

    const image =
      getMetaContent('og:image') ||
      getMetaContent('twitter:image') ||
      null

    const siteName =
      getMetaContent('og:site_name') ||
      validUrl.hostname

    return NextResponse.json({
      url: validUrl.toString(),
      title: title.trim(),
      description: description.trim(),
      image,
      siteName,
      domain: validUrl.hostname,
    })
  } catch (error: any) {
    console.error('Link preview error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
