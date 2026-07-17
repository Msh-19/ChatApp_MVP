import { useState, useMemo } from 'react'
import Image from 'next/image'
import { sileo } from 'sileo'
import { User, Message } from '@/types/chat'
import { detectLinks } from '@/lib/linkUtils'
import { formatSmartDate } from '@/lib/dateUtils'

interface ContactInfoProps {
    user: User | null
    isOpen: boolean
    onClose: () => void
    messages: Message[]
}

export default function ContactInfo({ user, isOpen, onClose, messages }: ContactInfoProps) {
    const [activeTab, setActiveTab] = useState<'media' | 'link' | 'docs'>('media')

    const { mediaMessages, sharedLinks } = useMemo(() => {
        const media = messages.filter(m => m.type === 'IMAGE' && m.attachmentUrl)

        const links: { url: string, date: string, id: string }[] = []
        messages.forEach(m => {
            if (m.type === 'TEXT' || m.type === 'IMAGE' || m.type === 'FILE' || m.type === 'AUDIO') { // Check content of all types
                const detected = detectLinks(m.content)
                detected.forEach(segment => {
                    if (segment.type === 'link' && segment.url) {
                        links.push({
                            url: segment.url,
                            date: new Date(m.createdAt).toISOString(),
                            id: m.id + segment.url // unique key
                        })
                    }
                })
            }
        })

        return { mediaMessages: media.reverse(), sharedLinks: links.reverse() }
    }, [messages])

    if (!isOpen) return null

    return (
        <div className={`fixed inset-y-0 right-0 z-40 w-80 lg:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Contact Info</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Profile */}
                <div className="px-6 pb-6 flex flex-col items-center border-b border-gray-100">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 relative shadow-sm border-2 border-white ring-2 ring-gray-100">
                        {user?.picture ? (
                            <Image src={user.picture} alt={user.name || 'User'} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
                </div>



                {/* Tabs */}
                <div className="px-6 pt-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                        {(['media', 'link', 'docs'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'media' && (
                        <>
                            {mediaMessages.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">No shared media</div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {mediaMessages.map((msg) => (
                                        <div key={msg.id} className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.attachmentUrl!, '_blank')}>
                                            <Image
                                                src={msg.attachmentUrl!}
                                                alt="Media"
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 33vw, 120px"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'link' && (
                        <div className="space-y-4">
                            {sharedLinks.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">No shared links</div>
                            ) : (
                                sharedLinks.map((link) => (
                                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors block">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-2.414 4.101l4 4a4 4 0 005.656-5.656l-4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{new URL(link.url).hostname}</p>
                                            <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{formatSmartDate(link.date)}</p>
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="space-y-4">
                            <h4 className="text-gray-500 text-sm font-medium mb-4">Shared Documents</h4>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">Project_Brief_v{i}.pdf</p>
                                        <p className="text-xs text-gray-500 uppercase">2.{i} MB • 12 Oct 2023</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
