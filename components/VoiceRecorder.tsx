'use client'

import { useState, useRef, useEffect } from 'react'

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
}

export default function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    startRecording()
    return () => cleanup()
  }, [])

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setRecordedAudio(url)
        setIsReviewing(true)
        if (timerRef.current) clearInterval(timerRef.current)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please grant permission.')
      onCancel()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration)
    }
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        {/* Cancel Button */}
        <button
          onClick={() => {
              cleanup()
              onCancel()
          }}
          className="p-3 rounded-full hover:bg-gray-100 transition-colors"
          title="Cancel"
        >
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isReviewing ? (
            // REVIEW MODE
            <div className="flex-1 flex items-center gap-4">
                {/* Audio Element (Hidden) */}
                <audio 
                    ref={audioRef} 
                    src={recordedAudio || ''} 
                    onEnded={() => setIsPlaying(false)}
                />
                
                {/* Play/Pause Review */}
                <button 
                    onClick={togglePlayback}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                    {isPlaying ? (
                        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                        <svg className="w-5 h-5 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                </button>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="h-1 bg-gray-200 rounded-full w-full overflow-hidden">
                        <div className={`h-full bg-gray-500 ${isPlaying ? 'animate-progress' : ''}`} style={{ width: '100%', animationDuration: `${duration}s`, animationPlayState: isPlaying ? 'running' : 'paused' }} />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Reviewing ({formatTime(duration)})</span>
                </div>
            </div>
        ) : (
            // RECORDING MODE
            <div className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-600">Recording...</span>
            </div>
            
            <span className="text-lg font-mono text-gray-800 min-w-[4rem]">
                {formatTime(duration)}
            </span>
            </div>
        )}

        {/* Action Button */}
        {isReviewing ? (
             <button
             onClick={handleSend}
             className="p-3 bg-[#2D9C86] rounded-full hover:bg-[#258572] transition-colors shadow-md"
             title="Send Voice Note"
           >
             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
           </button>
        ) : (
            <button
            onClick={stopRecording}
            className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-md"
            title="Stop Recording"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
