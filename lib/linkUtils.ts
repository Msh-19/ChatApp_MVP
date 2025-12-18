// Utility functions for detecting and parsing URLs in text

export interface TextSegment {
  type: 'text' | 'link'
  content: string
  url?: string
}

// Regex to detect URLs (http, https, www)
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi

export function detectLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let lastIndex = 0
  
  // Reset regex
  URL_REGEX.lastIndex = 0
  
  let match
  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      })
    }
    
    // Add the URL
    let url = match[0]
    // Add https:// if it starts with www.
    if (url.startsWith('www.')) {
      url = 'https://' + url
    }
    
    segments.push({
      type: 'link',
      content: match[0],
      url: url
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }
  
  // If no links found, return original text as single segment
  if (segments.length === 0) {
    return [{ type: 'text', content: text }]
  }
  
  return segments
}

export function extractFirstUrl(text: string): string | null {
  URL_REGEX.lastIndex = 0
  const match = URL_REGEX.exec(text)
  if (!match) return null
  
  let url = match[0]
  // Add https:// if it starts with www.
  if (url.startsWith('www.')) {
    url = 'https://' + url
  }
  
  return url
}
