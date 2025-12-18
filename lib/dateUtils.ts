// This tool call is actually to Update the utils file again.
export function formatSmartDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const y = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

  if (d.getTime() === t.getTime()) {
    return 'Today'
  } else if (d.getTime() === y.getTime()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  }
}

export function formatSidebarDate(dateString: string): string {
    const date = new Date(dateString)
    const today = new Date()
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    if (d.getTime() === t.getTime()) {
        // Return time for today
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
    }
    // Otherwise use smart date (Yesterday / Date)
    return formatSmartDate(dateString)
}

export function formatMessageTime(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
}
