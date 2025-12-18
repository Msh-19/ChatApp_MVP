'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { EmojiClickData } from 'emoji-picker-react'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

import VoiceRecorder from './VoiceRecorder'

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO', attachmentUrl?: string, fileName?: string, fileSize?: number) => void
  onTyping: (isTyping: boolean) => void
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File |null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ... (useEffect hooks remain same)

  const handleVoiceRecordComplete = async (audioBlob: Blob, duration: number) => {
    setIsRecording(false)
    setUploading(true)
    
    try {
      // Create file from blob
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' })
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      
      onSendMessage(
        'Voice Note', 
        'AUDIO', 
        data.url, // Cloudinary URL
        file.name,
        file.size // approx size
      )
    } catch (error) {
      console.error('Voice upload error:', error)
      alert('Failed to upload voice note')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest('.emoji-button')
      ) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    if (!isTyping) {
      setIsTyping(true)
      onTyping(true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTyping(false)
    }, 1000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      
      // Determine message type
      let messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'FILE'
      if (selectedFile.type.startsWith('image/')) {
        messageType = 'IMAGE'
      }

      // Send message with attachment and metadata
      onSendMessage(
        message || selectedFile.name, 
        messageType, 
        data.url,
        selectedFile.name,
        selectedFile.size
      )
      
      // Reset
      setMessage('')
      setSelectedFile(null)
      setFilePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If file selected, upload it
    if (selectedFile) {
      await handleFileUpload()
      return
    }

    const trimmed = message.trim()
    if (!trimmed) return

    onSendMessage(trimmed)
    setMessage('')
    setIsTyping(false)
    onTyping(false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = message.substring(0, cursorPosition)
    const textAfterCursor = message.substring(cursorPosition)
    const newMessage = textBeforeCursor + emojiData.emoji + textAfterCursor

    setMessage(newMessage)

    // Set cursor position after emoji
    setTimeout(() => {
      const newCursorPosition = cursorPosition + emojiData.emoji.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      textarea.focus()
    }, 0)

    setShowEmojiPicker(false)
  }

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  return (
    <div className="px-6 pb-6 pt-2 bg-[#F3F4F1] relative">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-2 p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-3">
          {filePreview && (
            <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null)
              setFilePreview(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {isRecording && (
        <VoiceRecorder 
          onRecordingComplete={handleVoiceRecordComplete}
          onCancel={() => setIsRecording(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="w-full bg-white border border-gray-200 rounded-full px-2 py-2 shadow-sm flex items-center transition-all focus-within:shadow-md">
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*"
        />

        <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? "Add a caption (optional)..." : "Type any message..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-6 max-h-32 min-h-[48px] text-[15px] text-gray-700 placeholder:text-gray-400"
            rows={1}
            style={{ outline: 'none' }}
        />

        <div className="flex items-center gap-1 pr-1">
             <IconButton 
               icon={<MicIcon />} 
               onClick={() => setIsRecording(true)}
             />
             <IconButton icon={<SmileIcon />} onClick={toggleEmojiPicker} className="emoji-button" />
             <IconButton 
               icon={<PaperclipIcon />} 
               onClick={() => fileInputRef.current?.click()}
             />

            <button
            type="submit"
            disabled={!message.trim() && !selectedFile || uploading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ml-2 ${
                (message.trim() || selectedFile) && !uploading
                ? 'bg-[#2D9C86] text-white shadow-md hover:bg-[#258572] transform hover:scale-105'
                : 'bg-[#2D9C86] text-white opacity-50 cursor-not-allowed'
            }`}
            aria-label="Send message"
            >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            </button>
        </div>
      </form>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className="absolute bottom-20 right-6 z-50 shadow-2xl rounded-xl"
        >
          <EmojiPicker 
            onEmojiClick={handleEmojiClick}
            width={320}
            height={400}
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </div>
  )
}

function IconButton({ icon, onClick, className }: { icon: React.ReactNode, onClick?: () => void, className?: string }) {
    return (
        <button type="button" onClick={onClick} className={`p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 ${className || ''}`}>
            {icon}
        </button>
    )
}

const MicIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
)

const SmileIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const PaperclipIcon = () => (
     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
)


