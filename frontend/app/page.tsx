'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

import { ChatInterface } from '@/components/ChatInterface'
import { useChatStore } from '@/lib/store'

const CameraView = dynamic(
  () => import('@/components/CameraView').then((m) => m.CameraView),
  { ssr: false, loading: () => <CameraSkeleton /> }
)

const VadListener = dynamic(
  () => import('@/components/VadListener').then((m) => m.VadListener),
  { ssr: false, loading: () => <VadSkeleton /> }
)

const Avatar3D = dynamic(
  () => import('@/components/Avatar3D').then((m) => m.Avatar3D),
  { ssr: false }
)

function VadSkeleton() {
  return (
    <div className="text-xs text-slate-400 animate-pulse">Memuat mic VAD…</div>
  )
}

function CameraSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900/10">
      <p className="text-sm text-slate-500 animate-pulse">Memuat kamera...</p>
    </div>
  )
}

export default function Home() {
  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return (
    // Viewport-bounded: nothing scrolls past the bottom of the window.
    // Ditambahkan background gradient elegan sebagai dasar untuk efek glassmorphism
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-slate-50 to-cyan-50 relative">
      
      {/* 3D Avatar Background - SEMENTARA DINONAKTIFKAN (Model 31MB bikin berat) */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden">
        {/* <Avatar3D /> */}
      </div>

      {/* Header tanpa efek blur */}
      <header className="shrink-0 px-4 py-2.5 border-b border-slate-200 bg-white/80 shadow-sm z-10">
        <h1 className="text-base font-semibold text-slate-900">Pointer</h1>
        <p className="text-[11px] text-slate-600 font-medium">Asisten Kampus</p>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 relative z-10 pointer-events-none">
        {/* Kontainer Kamera */}
        <section className="shrink-0 lg:shrink h-[32vh] lg:h-auto lg:w-[420px] xl:w-[480px] border-b lg:border-b-0 lg:border-r border-slate-200 bg-white/40 flex flex-col pointer-events-auto">
          <CameraView />
        </section>

        {/* Chat side */}
        <section className="flex flex-col flex-1 min-h-0 min-w-0 bg-transparent pointer-events-auto">
          <ChatInterface />
          <div className="shrink-0 py-3 flex justify-center border-t border-slate-200 bg-white/60">
            <VadListener />
          </div>
        </section>
      </div>
    </div>
  )
}

