'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
}

interface NewChatModalProps {
  currentUserId: string
  onClose: () => void
  onCreateChat: (participantIds: string[]) => void
}

export default function NewChatModal({
  currentUserId,
  onClose,
  onCreateChat,
}: NewChatModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleCreate = () => {
    if (selectedUsers.size > 0) {
      onCreateChat(Array.from(selectedUsers))
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">New Chat</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
          />
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.has(user.id)

                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-500/20 border border-indigo-500/50'
                        : 'hover:bg-[var(--bg-hover)] border border-transparent'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {user.picture ? (
                        <></>
                        // <Image
                        //   src={user.picture}
                        //   alt={user.name || 'User'}
                        //   width={40}
                        //   height={40}
                        //   className="rounded-full"
                        // />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {user.name?.[0] || user.email[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-6 h-6 text-indigo-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={selectedUsers.size === 0}
              className={`flex-1 ${
                selectedUsers.size > 0
                  ? 'btn-primary'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed px-6 py-3 rounded-xl'
              }`}
            >
              Create Chat {selectedUsers.size > 0 && `(${selectedUsers.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
