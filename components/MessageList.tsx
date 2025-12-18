import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { Message } from '@/types/chat'
import { formatSmartDate, formatMessageTime } from '@/lib/dateUtils'
import dynamic from 'next/dynamic'
import { Check, CheckCheck, Smile, Copy } from 'lucide-react'
import { EmojiClickData } from 'emoji-picker-react'
import { detectLinks } from '@/lib/linkUtils'
import LinkPreviewCard from './LinkPreviewCard'
import AudioPlayer from './AudioPlayer'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  typingUsers: Set<string>
  onDeleteMessage?: (messageId: string) => void
  onReaction?: (messageId: string, emoji: string) => void
}

export default function MessageList({
  messages,
  currentUserId,
  typingUsers,
  onDeleteMessage,
  onReaction,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    messageId: string
    senderId: string
  } | null>(null)
  
  const [pickerVisible, setPickerVisible] = useState<{
      messageId: string
      x: number
      y: number
  } | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUsers])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
        // Close context menu
        setContextMenu(null)
        
        // Close picker if clicking outside
        if (pickerVisible && !(e.target as Element).closest('.emoji-picker-container')) {
            setPickerVisible(null)
        }
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [pickerVisible])

  const handleContextMenu = (e: React.MouseEvent, messageId: string, senderId: string) => {
    e.preventDefault()
    const isOwnMessage = senderId === currentUserId
    // For own messages (right side), show menu to the left of cursor to avoid cropping
    const menuX = isOwnMessage ? e.clientX - 160 : e.clientX
    setContextMenu({ x: menuX, y: e.clientY, messageId, senderId })
  }

  const handleDelete = () => {
    if (contextMenu && onDeleteMessage) {
      onDeleteMessage(contextMenu.messageId)
    }
    setContextMenu(null)
  }

  const handleOpenReactionPicker = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (contextMenu) {
          // Improve positioning logic or just center it/place nearby
          setPickerVisible({
              messageId: contextMenu.messageId,
              x: Math.min(contextMenu.x, window.innerWidth - 350), // prevent overflow right
              y: Math.min(contextMenu.y, window.innerHeight - 450) // prevent overflow bottom
          })
          setContextMenu(null)
      }
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
      if (pickerVisible && onReaction) {
          onReaction(pickerVisible.messageId, emojiData.emoji)
          setPickerVisible(null)
      }
  }

  const formatTime = (dateString: string) => {
    return formatMessageTime(dateString)
  }

  const formatDate = (dateString: string) => {
    return formatSmartDate(dateString)
  }

  let lastDate = ''

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#F3F4F1]">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUserId
            const messageDate = formatDate(new Date(message.createdAt).toISOString())
            const showDateDivider = messageDate !== lastDate
            lastDate = messageDate
            
            // Check if we should show timestamp (group consecutive messages from same sender in same minute)
            const nextMessage = messages[index + 1]
            const isNextMessageSameSender = nextMessage?.senderId === message.senderId
            const currentTime = formatTime(new Date(message.createdAt).toISOString())
            const nextTime = nextMessage ? formatTime(new Date(nextMessage.createdAt).toISOString()) : null
            const isNextMessageSameTime = currentTime === nextTime
            const showTimestamp = !nextMessage || !isNextMessageSameSender || !isNextMessageSameTime
            
            // Group reactions
            const reactions = message.reactions || []
            // Simplify for display: count each emoji type
            const reactionCounts: Record<string, { count: number, hasReacted: boolean, code: string }> = {}
            reactions.forEach(r => {
                if (!reactionCounts[r.emoji]) {
                    reactionCounts[r.emoji] = { count: 0, hasReacted: false, code: r.emoji }
                }
                reactionCounts[r.emoji].count++
                if (r.userId === currentUserId) reactionCounts[r.emoji].hasReacted = true
            })

            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-6">
                    <div className="px-4 py-1.5 bg-white rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-100">
                      {messageDate}
                    </div>
                  </div>
                )}

                <div
                  className={`flex gap-3 message-enter ${
                    isOwnMessage ? 'flex-row-reverse' : ''
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="flex-shrink-0 self-end mb-1">
                      {message.sender.picture ? (
                        <Image
                          src={message.sender.picture}
                          alt={message.sender.name || 'User'}
                          width={36}
                          height={36}
                          className="rounded-full object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                          {message.sender.name?.[0] ||
                            message.sender.email[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] sm:max-w-md flex flex-col ${
                      isOwnMessage ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`px-4 pt-2 pb-2 shadow-sm relative group cursor-pointer ${
                        isOwnMessage
                          ? 'bg-[#E9F5F0] text-gray-800 rounded-[24px] rounded-tr-none border border-[#DEEDE8]'
                          : 'bg-white text-gray-800 rounded-[24px] rounded-tl-none border border-gray-100'
                      }`}
                      onContextMenu={(e) => handleContextMenu(e, message.id, message.senderId)}
                    >
                      <div className="text-[15px] leading-relaxed break-words font-medium">
                        {detectLinks(message.content).map((segment, idx) => {
                          if (segment.type === 'link') {
                            return (
                              <a
                                key={idx}
                                href={segment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#2D9C86] underline hover:text-[#258572] transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {segment.content}
                              </a>
                            )
                          }
                          return <span key={idx}>{segment.content}</span>
                        })}
                      </div>

                      {/* Image Attachment */}
                      {message.type === 'IMAGE' && message.attachmentUrl && (
                        <div className="mt-2">
                          <img
                            src={message.attachmentUrl}
                            alt="Attachment"
                            className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.attachmentUrl!, '_blank')}
                          />
                        </div>
                      )}

                      {/* File Attachment */}
                      {message.type === 'FILE' && message.attachmentUrl && (
                        <a
                          href={message.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={message.fileName || 'download'}
                          className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex-shrink-0">
                            {getFileIcon(message.fileName || '')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {message.fileName || 'File'}
                            </p>
                            {message.fileSize && (
                              <p className="text-xs text-gray-500">
                                {formatFileSize(message.fileSize)}
                              </p>
                            )}
                          </div>
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      )}

                      {/* Audio Attachment */}
                      {message.type === 'AUDIO' && message.attachmentUrl && (
                        <div className="mt-2">
                          <AudioPlayer audioUrl={message.attachmentUrl} />
                        </div>
                      )}

                      {/* Link Preview */}
                      {message.linkPreview && (
                        <LinkPreviewCard preview={message.linkPreview} />
                      )}

                      {/* Time & Status - Below Text, Inside Bubble */}
                      {showTimestamp && (
                        <div className={`flex items-center gap-1 mt-1 text-[11px] font-medium text-gray-400 ${isOwnMessage ? 'justify-end' : 'justify-end'}`}>
                            <span>{formatTime(new Date(message.createdAt).toISOString())}</span>
                            {isOwnMessage && (
                                <span className="flex items-center">
                                    {(message.readBy && message.readBy.length > 0 && message.readBy.some(id => id !== currentUserId)) ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-[#2D9C86]" />
                                    ) : (message.deliveredTo && message.deliveredTo.length > 0 && message.deliveredTo.some(id => id !== currentUserId)) ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                                    ) : (
                                        <Check className="w-3.5 h-3.5 text-gray-400" />
                                    )}
                                </span>
                            )}
                        </div>
                      )}

                      {/* Reactions Display - Absolute Positioned */}
                      {Object.values(reactionCounts).length > 0 && (
                          <div className={`absolute -bottom-2 ${isOwnMessage ? 'left-2' : 'right-2'} flex gap-1 z-10`}>
                              {Object.values(reactionCounts).map((r, i) => (
                                  <button
                                      key={i}
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          onReaction && onReaction(message.id, r.code);
                                      }}
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full border shadow-sm transition-transform hover:scale-110 ${r.hasReacted ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-gray-100 text-gray-600'}`}
                                  >
                                      {r.code} {r.count > 1 && <span className="font-bold ml-0.5">{r.count}</span>}
                                  </button>
                              ))}
                          </div>
                      )}
                    </div>
                    

                  </div>
                </div>
              </div>
            )
          })}

          {typingUsers.size > 0 && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-9"></div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="typing-indicator">
                  <span className="bg-gray-400"></span>
                  <span className="bg-gray-400"></span>
                  <span className="bg-gray-400"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {contextMenu && (
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={() => {
                  const message = messages.find(m => m.id === contextMenu.messageId)
                  if (message) {
                    navigator.clipboard.writeText(message.content)
                  }
                  setContextMenu(null)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Message
              </button>
              
              <button
                onClick={handleOpenReactionPicker}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Smile className="w-4 h-4" />
                Add Reaction
              </button>
              
              {contextMenu.senderId === currentUserId && (
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
              )}
            </div>
          )}
          
          {pickerVisible && (
              <div 
                className="fixed z-[60] emoji-picker-container shadow-2xl rounded-xl"
                style={{ top: pickerVisible.y, left: pickerVisible.x }}
              >
                  <EmojiPicker 
                    onEmojiClick={onEmojiClick}
                    width={320}
                    height={400}
                    lazyLoadEmojis={true}
                  />
              </div>
          )}
        </>
      )}
    </div>
  )
}

function Trash2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Helper function to get file icon based on file extension
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  // PDF files
  if (ext === 'pdf') {
    return (
      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.5,17C15.5,17.8 14.3,18.5 13,18.5C11.3,18.5 9.8,17.8 9.8,17V16H11.3V17C11.3,17.2 11.9,17.5 13,17.5C14,17.5 14.5,17.3 14.5,17C14.5,16.8 14.1,16.5 13.3,16.4C11.5,16.3 10,15.9 10,14.5C10,13.3 11.3,12.5 13,12.5C14.7,12.5 16,13.3 16,14.5H14.5C14.5,14.3 13.9,14 13,14C12.1,14 11.5,14.2 11.5,14.5C11.5,14.7 11.9,15 12.7,15.1C14.5,15.2 16,15.6 16,17M13,4V9H18V20H6V4H13Z" />
      </svg>
    )
  }
  
  // Word documents
  if (ext === 'doc' || ext === 'docx') {
    return (
      <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,20H5.5V4H13V9H18.5V20M7,11H9.5L10.5,15.5L11.5,11H14L12,18H10L8.5,13.5L7,18H5L7,11Z" />
      </svg>
    )
  }
  
  // Excel/spreadsheets
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
    return (
      <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,20H5.5V4H13V9H18.5V20M12.5,11L10.5,15.5L12.5,20H14.5L12.5,15.5L14.5,11H12.5M7.5,11L5.5,15.5L7.5,20H9.5L7.5,15.5L9.5,11H7.5Z" />
      </svg>
    )
  }
  
  // Default file icon
  return (
    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}
