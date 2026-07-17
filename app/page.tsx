'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Zap, 
  Bot, 
  Users, 
  History, 
  ArrowRight, 
  MessageSquare, 
  Search, 
  MoreVertical, 
  Send, 
  PlusCircle, 
  ShieldCheck, 
  Network, 
  UserCheck,
  Quote
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if the user is already authenticated via server session
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.token && data.user) {
            localStorage.setItem('auth-token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            setIsAuthenticated(true)
            router.push('/chat')
            return
          }
        }
      } catch (err) {
        console.error('Auth verification error:', err)
      }
      // If we reach here, we are not logged in or auth failed
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user')
      setLoading(false)
    }
    
    checkAuth()
  }, [router])

  // Fade-in effect on scroll for cards (mimicking intersection observer)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-10')
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.bento-card').forEach(el => {
      el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10')
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-500">
            {isAuthenticated ? 'Redirecting to chat...' : 'Loading...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Styles Block to Support SaaS Layout variables locally */}
      <style jsx global>{`
        .grid-pattern {
          background-image: radial-gradient(circle, #10B98115 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .hero-gradient {
          background: radial-gradient(circle at 70% 30%, #10B98108 0%, transparent 60%),
                      radial-gradient(circle at 10% 80%, #05966905 0%, transparent 50%);
        }
        .bento-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .bento-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 20px 40px -20px rgba(16, 185, 129, 0.25);
        }
      `}</style>

      <div className="text-[#111827] bg-[#FDFBF8] min-h-screen selection:bg-[#e6f7f0] selection:text-[#059669]">
        {/* Top Navigation Bar */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#E5E7EB]/30">
          <nav className="flex justify-between items-center px-6 w-full max-w-[1280px] mx-auto h-20">
            <div className="flex items-center gap-2">
              <img 
                alt="ChatApp Logo" 
                className="h-10 w-10 object-contain drop-shadow-sm animate-pulse" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpnUfPsnk5veGxD2_0sokfcIISYvKCxzyWPtZgsirZodCsagwfvLqMQS6T6PJ9oxJ1Hgne6qqECmC78RaK2kXB5EfduF78IrH4a4rlZbS2qs8HjXEaEribQj90gBtWk_xQp48NMwOgWMYVDEUQAr9c-RQBPOnYAVyY0dP-0ojjOXisGi54YGbeeMm1uHRdI0eI5Oy-5_XOb5IdCT6Pg54yZ8WVXaoEhvUhckNZbE-lD5PrMKQvQhNOXhPJxzaOrfa_HgcFSrmhTYg"
              />
              <span className="font-bold text-2xl tracking-tighter text-[#10B981]">ChatApp</span>
            </div>
            
            <div className="hidden md:flex items-center gap-10">
              <a className="text-sm font-semibold text-[#6B7280] hover:text-[#10B981] transition-colors" href="#features">Features</a>
              <a className="text-sm font-semibold text-[#6B7280] hover:text-[#10B981] transition-colors" href="#ai">AI Assistant</a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/login')}
                className="text-sm font-semibold text-[#6B7280] hover:text-[#10B981] px-4 py-2 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="bg-[#10B981] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-[#10B981]/20 transition-all active:scale-95 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </nav>
        </header>

        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-10 lg:py-32 hero-gradient">
            <div className="absolute inset-0 grid-pattern pointer-events-none opacity-50"></div>
            
            <div className="max-w-[1280px] mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center relative z-10">
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#10B981]/10 text-[#10B981] rounded-full text-xs font-bold border border-[#10B981]/20 backdrop-blur-sm">
                    <Zap className="w-3.5 h-3.5 fill-[#10B981]" /> Real-time Messaging
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#54647a]/15 text-[#505f76] rounded-full text-xs font-bold border border-[#505f76]/20 backdrop-blur-sm">
                    <Bot className="w-3.5 h-3.5 text-[#10B981]" /> AI Assistant
                  </span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight text-[#111827]">
                  Conversations <br />at the speed of <span className="text-[#10B981] italic">thought.</span>
                </h1>

                <p className="text-lg text-[#6B7280] mb-8 max-w-lg leading-relaxed">
                  Experience the next generation of communication. Chat instantly with global teams and get smart context-aware help from our integrated AI agents.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => router.push('/login')}
                    className="bg-[#10B981] text-white px-8 py-4 rounded-2xl text-sm font-bold flex items-center gap-2 hover:shadow-2xl hover:shadow-[#10B981]/30 transition-all active:scale-95 group cursor-pointer"
                  >
                    Start Chatting Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a 
                    href="#features"
                    className="bg-white border border-[#E5E7EB]/50 text-gray-800 px-8 py-4 rounded-2xl text-sm font-bold flex items-center justify-center hover:bg-[#F3F4F6] transition-all active:scale-95"
                  >
                    How it works
                  </a>
                </div>

                <div className="mt-10 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-[#E5E7EB]"></div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-[#a7f3d0]"></div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-[#cfebd9]"></div>
                  </div>
                  <p className="text-xs text-[#6B7280] font-semibold">
                    Trusted by <span className="font-bold text-gray-900">5,000+</span> developers
                  </p>
                </div>
              </div>

              {/* Dashboard Mockup */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-[#10B981]/10 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden aspect-[4/3] flex transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                  {/* Mockup Sidebar */}
                  <div className="w-16 lg:w-56 bg-[#F3F4F6]/50 border-r border-[#E5E7EB]/30 flex flex-col p-4">
                    <div className="flex items-center gap-2 mb-8">
                      <div className="w-8 h-8 rounded-lg bg-[#10B981] shrink-0 shadow-lg shadow-[#10B981]/30"></div>
                      <div className="hidden lg:block">
                        <p className="font-bold text-sm tracking-tight text-gray-900">ChatApp</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-[#10B981] text-white rounded-xl shadow-lg shadow-[#10B981]/20">
                        <MessageSquare className="w-5 h-5 shrink-0" />
                        <span className="hidden lg:block font-bold text-xs">Messages</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 text-[#6B7280] hover:bg-[#E5E7EB] rounded-xl transition-colors cursor-pointer">
                        <Bot className="w-5 h-5 shrink-0" />
                        <span className="hidden lg:block font-bold text-xs">AI Agent</span>
                      </div>
                    </div>
                  </div>

                  {/* Mockup Main Content */}
                  <div className="flex-1 flex flex-col bg-white">
                    <div className="h-16 border-b border-[#E5E7EB]/30 flex items-center justify-between px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                        <span className="font-bold text-sm text-gray-800">General Team</span>
                      </div>
                      <div className="flex gap-2 text-gray-400">
                        <Search className="w-5 h-5" />
                        <MoreVertical className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-hidden">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#E5E7EB] shrink-0"></div>
                        <div className="bg-[#F3F4F6] p-3 rounded-2xl rounded-tl-none max-w-[80%] text-xs shadow-sm text-gray-700">
                          Hey team! Has anyone finished the latest tech review?
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <div className="bg-[#10B981] text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] text-xs shadow-lg shadow-[#10B981]/20">
                          Just pushed it. AI agent summarized the main points.
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0 border border-[#10B981]/20">
                          <Bot className="w-4 h-4 text-[#10B981]" />
                        </div>
                        <div className="bg-[#e6f7f0] text-[#10B981] p-3 rounded-2xl rounded-tl-none max-w-[80%] text-xs border border-[#10B981]/20 font-medium">
                          <b className="font-bold">AI Summary:</b> The review highlights 3 major optimizations...
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-[#E5E7EB]/30">
                      <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-4 py-2">
                        <PlusCircle className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-400 text-xs flex-1">Type your message...</span>
                        <Send className="w-5 h-5 text-[#10B981]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 -left-8 bg-white p-5 rounded-2xl shadow-2xl hidden lg:flex items-center gap-3 border border-[#E5E7EB]/20 animate-bounce" style={{ animationDuration: '4s' }}>
                  <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#10B981]">99+ Online</p>
                    <p className="text-xs text-[#6B7280] font-semibold">Collaborating now</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-16 lg:py-32 bg-white relative" id="features">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#10B981]/5 to-transparent"></div>
            
            <div className="max-w-[1280px] mx-auto px-6 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight text-gray-900">High-performance communication</h2>
                <p className="text-[#6B7280] text-lg leading-relaxed">Engineered with modern technologies to ensure your conversations are secure, instant, and intelligent.</p>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                <div className="bento-card p-8 bg-[#F3F4F6]/60 rounded-[2rem] border border-[#E5E7EB]/30 group">
                  <div className="w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#10B981] group-hover:text-white transition-all text-[#10B981]">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Real-time Messaging</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">Zero-latency communication powered by modern webhooks and socket architecture.</p>
                </div>

                <div className="bento-card p-8 bg-[#F3F4F6]/60 rounded-[2rem] border border-[#E5E7EB]/30 group lg:mt-10">
                  <div className="w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#10B981] group-hover:text-white transition-all text-[#10B981]">
                    <Bot className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">AI Assistant</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">Integrated agents that help summarize threads, generate code, and answer questions.</p>
                </div>

                <div className="bento-card p-8 bg-[#F3F4F6]/60 rounded-[2rem] border border-[#E5E7EB]/30 group">
                  <div className="w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#10B981] group-hover:text-white transition-all text-[#10B981]">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">User Presence</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">Know exactly when your team is online with fine-grained status indicators.</p>
                </div>

                <div className="bento-card p-8 bg-[#F3F4F6]/60 rounded-[2rem] border border-[#E5E7EB]/30 group lg:mt-10">
                  <div className="w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#10B981] group-hover:text-white transition-all text-[#10B981]">
                    <History className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Persistent Chats</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">Every message and AI insight is indexed and searchable across any device.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Product Showcase */}
          <section className="py-20 lg:py-32 bg-[#FDFBF8]" id="ai">
            <div className="max-w-[1280px] mx-auto px-6 space-y-32">
              
              {/* Row 1 */}
              <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1">
                  <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight tracking-tight text-gray-900">
                    Instant feel,<br /><span className="text-[#10B981]">Reliable scale.</span>
                  </h2>
                  <p className="text-[#6B7280] text-lg mb-8 leading-relaxed">
                    We've optimized every millisecond of the message delivery pipeline. Using high-efficiency web sockets, your team stays in sync without ever needing a manual refresh.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-[#6B7280] font-semibold text-sm">
                      <ShieldCheck className="w-5 h-5 text-[#10B981]" /> End-to-end encryption by default
                    </li>
                    <li className="flex items-center gap-3 text-[#6B7280] font-semibold text-sm">
                      <Network className="w-5 h-5 text-[#10B981]" /> Distributed multi-channel support
                    </li>
                  </ul>
                </div>

                <div className="flex-1 w-full relative">
                  <div className="absolute -inset-10 bg-[#10B981]/5 blur-[100px] rounded-full"></div>
                  <div className="relative rounded-[2.5rem] overflow-hidden border border-[#E5E7EB]/30 shadow-2xl group">
                    <img 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                      alt="A clean professional interface of a real-time messaging dashboard with emerald accents." 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWyWsXMzulHGEeILotEPQINzCxfXXlH1RK0uXx_GxtB-Nv_DgQid3OchlZOdvOHPfQ0jyRzCHQ9lS9kvZSzxTYBXvJwaQE8EonBZeo2DA1gt3dcgRIuyJlHY1Dw0dsaytQoJVWcNKEdge8sedYi3k32gNjvPmcOv0lwaa-amsO2TMjHwl1wTTvWiPkSLfSDYdAxsIfk2aSgEJR-duzEEmK3kntbEIj1pwZOkrAdomE6MFs2WcEkEyJYA6wAYPhoYH4lVEtrufM43Y"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2 (Reversed) */}
              <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                <div className="flex-1">
                  <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight tracking-tight text-gray-900">
                    Contextual <br /><span className="text-[#1E9A80]">Intelligence.</span>
                  </h2>
                  <p className="text-[#6B7280] text-lg mb-8 leading-relaxed">
                    Stop switching tabs to find answers. Our AI is integrated directly into the chat flow. Tag our bot to summarize long discussions, translate messages, or perform technical lookups.
                  </p>
                  
                  <div className="p-8 bg-[#059669]/10 rounded-[2rem] border border-[#059669]/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Quote className="text-[#1E9A80] w-24 h-24" />
                    </div>
                    <p className="text-2xl italic text-[#1E9A80] font-bold leading-tight">
                      "Summarize the last 50 messages in this channel."
                    </p>
                    <p className="text-sm text-[#1E9A80] font-bold mt-4 flex items-center gap-2">
                      <span className="w-8 h-[2px] bg-[#1E9A80]/30"></span> Common User Command
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full relative">
                  <div className="absolute -inset-10 bg-[#059669]/10 blur-[100px] rounded-full"></div>
                  <div className="relative rounded-[2.5rem] overflow-hidden border border-[#E5E7EB]/30 shadow-2xl group">
                    <img 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                      alt="An AI dashboard with emerald accents." 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBztN-TQwH3ouRKmHZZ-uh-UIm0lB2W7qpYvtxTmwnZkQFbxVyVtmMX0BhzPi63MmprSit-WV4ZxK5Tzqs0S7qeGB3hfXVAjOi-xRj-25N3Ez8olExf6VJqXVZVatfSTmS06IHti2bDNjtD3LmLMWCzjWA9bA4W9gCvs-tSIsLLB2lzDjdPN8MKFGKaYQ1PggL9avyfrFk8FzaXiskdCrfERNJAsi-ln6-0W3g_nqf8LX-CtUsW2noS7w9QTQqsS-YACQlZqE_q6bs"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1">
                  <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight tracking-tight text-gray-900">
                    Secure access, <br /><span className="text-[#10B981]">Zero friction.</span>
                  </h2>
                  <p className="text-[#6B7280] text-lg mb-8 leading-relaxed">
                    Get started in seconds. We support Google OAuth for a frictionless onboarding experience. No more managing complex passwords or forgotten credentials.
                  </p>
                  
                  <button 
                    onClick={() => router.push('/login')}
                    className="bg-white border border-[#E5E7EB]/50 px-6 py-4 rounded-2xl flex items-center gap-4 text-[#111827] text-sm font-bold hover:bg-[#F3F4F6] hover:border-[#10B981] transition-all shadow-lg hover:shadow-xl group cursor-pointer"
                  >
                    <img 
                      alt="Google Logo" 
                      className="w-6 h-6 group-hover:scale-110 transition-transform" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPSGsUvhx69HECuBd2gUg_oOwEtex_H84NwOgGmBRumNbELtGJxLI2Hz2PtK6ZnHTKxaMBFdG6kLFWhITH8VvBvwdqsXySwz-T8tx68lK5nXQGEEfLsx4lYPDDnGrUhZvSLRoncfFSo7_5HMpjl4D_3CWoBT1ix5hPnFAjDSjkjUKZDeruBbPMmo0eL943Mkza32jyFZZaai9EGNbUGq_YQWf3Bev6-A2ayaAdesqwfrONBMuveELsqrE4Zotyqc1bGPxlDzjJtCA"
                    />
                    Continue with Google Account
                  </button>
                </div>

                <div className="flex-1 w-full relative">
                  <div className="absolute -inset-10 bg-[#10B981]/5 blur-[100px] rounded-full"></div>
                  <div className="relative rounded-[2.5rem] overflow-hidden border border-[#E5E7EB]/30 shadow-2xl group">
                    <img 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                      alt="Login screen with emerald design elements." 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxkWBdJDc1w5hkegOXa7uwAi9i2jRM5QrDj8yhzv0PN43-AhzdlpPR_WjKEkJtBpsdmjpDkJBVCVB35M83utiWTFTnQAjlIAO7jsQpe236SPaGmPIbOJ9H8vr4nQZcpFK_3puHDoZdi74v9ficsM2mdcnye8vu6-y3m0OC7Udn-0Q5mRAOYvjbYZlaRcjRJfuT-QUuaM7i4magIozf9TE3rGtLd845Pu_iBenGaOckv3xwxNnZ_jZvFlgb2bhM5e7bHflDugjZNYA"
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Tech Stack */}
          <section className="py-16 lg:py-32 bg-[#F3F4F6] relative overflow-hidden" id="tech">
            <div className="absolute inset-0 grid-pattern opacity-20"></div>
            
            <div className="max-w-[1280px] mx-auto px-6 relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight text-gray-900">Enterprise Grade Infrastructure</h2>
                <p className="text-[#6B7280] text-lg max-w-2xl mx-auto font-medium">Built with the modern stack for unparalleled performance and scalability.</p>
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10">
                <span className="text-2xl font-bold grayscale hover:grayscale-0 transition-all cursor-default text-[#10B981] opacity-50 hover:opacity-100">Next.js</span>
                <span className="text-2xl font-bold grayscale hover:grayscale-0 transition-all cursor-default text-[#10B981] opacity-50 hover:opacity-100">React</span>
                <span className="text-2xl font-bold grayscale hover:grayscale-0 transition-all cursor-default text-[#10B981] opacity-50 hover:opacity-100">TypeScript</span>
                <span className="text-2xl font-bold grayscale hover:grayscale-0 transition-all cursor-default text-[#10B981] opacity-50 hover:opacity-100">Socket.IO</span>
                <span className="text-2xl font-bold grayscale hover:grayscale-0 transition-all cursor-default text-[#10B981] opacity-50 hover:opacity-100">Prisma</span>
                <span className="text-2xl font-bold grayscale hover:grayscale-0 transition-all cursor-default text-[#10B981] opacity-50 hover:opacity-100">PostgreSQL</span>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-20 lg:py-32">
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="bg-[#10B981] px-8 py-24 lg:py-32 rounded-[4rem] text-white relative overflow-hidden shadow-2xl shadow-[#10B981]/30">
                {/* Dynamic background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[150px] translate-x-1/4 translate-y-1/4"></div>
                </div>
                
                <div className="max-w-3xl mx-auto text-center relative z-10">
                  <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight leading-none text-white">Start a smarter conversation today</h2>
                  <p className="text-white/80 text-lg mb-8 leading-relaxed">
                    Join thousands of developers and teams who are revolutionizing their workflow with ChatApp's AI-assisted communication platform.
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={() => router.push('/login')}
                      className="bg-white text-[#10B981] px-10 py-4 rounded-2xl text-sm font-bold hover:shadow-2xl hover:scale-105 transition-all active:scale-95 cursor-pointer"
                    >
                      Create Free Account
                    </button>
                    <a 
                      href="#features"
                      className="bg-[#059669]/20 border border-white/20 text-white px-10 py-4 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all active:scale-95"
                    >
                      Browse Features
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E5E7EB]/30">
          <div className="w-full py-10 px-6 flex flex-col md:flex-row justify-between items-center max-w-[1280px] mx-auto gap-6">
            <div className="flex items-center gap-2">
              <img 
                alt="ChatApp Logo" 
                className="h-8 w-8 object-contain opacity-80" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpnUfPsnk5veGxD2_0sokfcIISYvKCxzyWPtZgsirZodCsagwfvLqMQS6T6PJ9oxJ1Hgne6qqECmC78RaK2kXB5EfduF78IrH4a4rlZbS2qs8HjXEaEribQj90gBtWk_xQp48NMwOgWMYVDEUQAr9c-RQBPOnYAVyY0dP-0ojjOXisGi54YGbeeMm1uHRdI0eI5Oy-5_XOb5IdCT6Pg54yZ8WVXaoEhvUhckNZbE-lD5PrMKQvQhNOXhPJxzaOrfa_HgcFSrmhTYg"
              />
              <span className="font-bold text-[20px] text-gray-900 tracking-tighter">ChatApp AI</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-10">
              <a className="text-sm font-semibold text-[#6B7280] hover:text-[#10B981] transition-colors" href="#">Privacy</a>
              <a className="text-sm font-semibold text-[#6B7280] hover:text-[#10B981] transition-colors" href="#">Terms</a>
              <a className="text-sm font-semibold text-[#6B7280] hover:text-[#10B981] transition-colors" href="#">Security</a>
            </div>
            
            <p className="text-xs text-[#6B7280]/70 font-semibold">© 2024 ChatApp AI. Built for the future.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
