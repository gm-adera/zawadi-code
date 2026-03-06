'use client'
import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Lock, Eye } from 'lucide-react'

interface PhotoGalleryProps {
  publicPhotos: string[]
  privatePhotoCount: number
  companionId: string
  companionName: string
  hasBooking?: boolean
}

export default function PhotoGallery({
  publicPhotos,
  privatePhotoCount,
  companionId,
  companionName,
  hasBooking = false,
}: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [privateUrls, setPrivateUrls] = useState<string[]>([])
  const [loadingPrivate, setLoadingPrivate] = useState(false)
  const [showPrivate, setShowPrivate] = useState(false)
  const [privateError, setPrivateError] = useState('')

  const allPhotos = [...publicPhotos, ...privateUrls]
  const displayPhotos = publicPhotos.length > 0 ? publicPhotos : []

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx)
    setLightboxOpen(true)
  }

  const prev = () => setLightboxIdx(i => (i - 1 + allPhotos.length) % allPhotos.length)
  const next = () => setLightboxIdx(i => (i + 1) % allPhotos.length)

  const unlockPrivate = async () => {
    setLoadingPrivate(true)
    setPrivateError('')
    try {
      const res = await fetch(`/api/photos/private?companionId=${companionId}`)
      const data = await res.json()
      if (!res.ok) {
        if (data.requiresBooking) {
          setPrivateError('Book this companion first to unlock her private photos')
        } else {
          setPrivateError(data.error)
        }
        return
      }
      setPrivateUrls(data.urls)
      setShowPrivate(true)
    } catch {
      setPrivateError('Failed to load private photos')
    } finally {
      setLoadingPrivate(false)
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, allPhotos.length])

  if (displayPhotos.length === 0 && privatePhotoCount === 0) {
    return (
      <div className="rounded-2xl flex items-center justify-center h-48 text-5xl"
        style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
        📷
      </div>
    )
  }

  return (
    <>
      {/* PHOTO GRID */}
      <div className="space-y-2">
        {/* Main photo */}
        {displayPhotos[0] && (
          <div className="aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer relative group"
            onClick={() => openLightbox(0)}>
            <img src={displayPhotos[0]} alt={companionName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <Eye size={28} className="text-white"/>
            </div>
          </div>
        )}

        {/* Thumbnail grid */}
        {displayPhotos.length > 1 && (
          <div className={`grid gap-2 ${displayPhotos.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {displayPhotos.slice(1, 4).map((url, i) => (
              <div key={url} className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group"
                onClick={() => openLightbox(i + 1)}>
                <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                {i === 2 && displayPhotos.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: 'rgba(0,0,0,0.55)' }}>
                    +{displayPhotos.length - 4} more
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PRIVATE PHOTOS UNLOCK */}
        {privatePhotoCount > 0 && (
          <div className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(232,93,38,0.06)', border: '1.5px dashed rgba(232,93,38,0.3)' }}>
            {!showPrivate ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock size={16} style={{ color: 'var(--accent)' }}/>
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                    {privatePhotoCount} Private &quot;One Real&quot; Photo{privatePhotoCount > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                  {hasBooking
                    ? 'You have a booking — unlock her real photos'
                    : 'Book this companion to unlock her private photos'}
                </p>
                {privateError && (
                  <p className="text-xs mb-3 font-medium" style={{ color: 'var(--accent)' }}>{privateError}</p>
                )}
                <button
                  onClick={unlockPrivate}
                  disabled={loadingPrivate}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: hasBooking ? 'var(--accent)' : 'rgba(232,93,38,0.15)',
                    color: hasBooking ? 'white' : 'var(--accent)',
                    border: '1px solid rgba(232,93,38,0.4)',
                  }}>
                  {loadingPrivate ? 'Unlocking...' : hasBooking ? '🔓 View Private Photos' : '🔒 Requires Booking'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>🔓 Private Photos Unlocked</p>
                <div className="grid grid-cols-3 gap-2">
                  {privateUrls.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => openLightbox(displayPhotos.length + i)}>
                      <img src={url} alt="" className="w-full h-full object-cover"/>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <X size={18}/>
          </button>

          {allPhotos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <ChevronLeft size={22}/>
              </button>
              <button onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-16 w-10 h-10 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <ChevronRight size={22}/>
              </button>
            </>
          )}

          <img
            src={allPhotos[lightboxIdx]}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.8)' }}
          />

          <div className="absolute bottom-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {lightboxIdx + 1} / {allPhotos.length}
            {lightboxIdx >= displayPhotos.length && <span style={{ color: 'var(--accent)' }}> 🔒 Private</span>}
          </div>
        </div>
      )}
    </>
  )
}
