'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, X, Lock, Eye, Star, Image, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface PhotoUploaderProps {
  publicPhotos: string[]
  privatePhotos: string[]  // paths only (not URLs)
  privatePhotoCount: number
  onUpdate: (publicPhotos: string[], privatePhotoCount: number) => void
}

interface PhotoSlot {
  url: string
  isPrivate: boolean
  uploading?: boolean
}

export default function PhotoUploader({
  publicPhotos,
  privatePhotos,
  privatePhotoCount,
  onUpdate,
}: PhotoUploaderProps) {
  const [pubPhotos, setPubPhotos] = useState<string[]>(publicPhotos)
  const [privCount, setPrivCount] = useState(privatePhotoCount)
  const [dragging, setDragging] = useState<'public' | 'private' | null>(null)
  const [uploading, setUploading] = useState(false)
  const pubRef = useRef<HTMLInputElement>(null)
  const privRef = useRef<HTMLInputElement>(null)

  const uploadPhoto = async (file: File, isPrivate: boolean) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large — max 5MB')
      return
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, WebP files allowed')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('is_private', String(isPrivate))

      const res = await fetch('/api/photos/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (isPrivate) {
        const newCount = privCount + 1
        setPrivCount(newCount)
        onUpdate(pubPhotos, newCount)
        toast.success('🔒 Private photo uploaded!')
      } else {
        const newPubs = [...pubPhotos, data.url]
        setPubPhotos(newPubs)
        onUpdate(newPubs, privCount)
        toast.success('📸 Photo uploaded!')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (url: string, isPrivate: boolean) => {
    if (!confirm('Delete this photo?')) return
    try {
      const res = await fetch('/api/photos/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, is_private: isPrivate }),
      })
      if (!res.ok) throw new Error('Delete failed')

      if (!isPrivate) {
        const updated = pubPhotos.filter(u => u !== url)
        setPubPhotos(updated)
        onUpdate(updated, privCount)
      } else {
        const newCount = Math.max(0, privCount - 1)
        setPrivCount(newCount)
        onUpdate(pubPhotos, newCount)
      }
      toast.success('Photo removed')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent, isPrivate: boolean) => {
    e.preventDefault()
    setDragging(null)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    files.slice(0, isPrivate ? 3 - privCount : 8 - pubPhotos.length).forEach(f => uploadPhoto(f, isPrivate))
  }, [pubPhotos, privCount])

  return (
    <div className="space-y-8">
      {/* PUBLIC PHOTOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Eye size={16} style={{ color: 'var(--gold)' }}/>
              Public Photos
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}>
                {pubPhotos.length}/8
              </span>
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Visible to everyone. First photo is your profile picture.
            </p>
          </div>
          <button
            onClick={() => pubRef.current?.click()}
            disabled={uploading || pubPhotos.length >= 8}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--gold)', color: 'var(--deep)' }}>
            <Upload size={14}/>
            Add Photo
          </button>
        </div>

        <input
          ref={pubRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => Array.from(e.target.files || []).forEach(f => uploadPhoto(f, false))}
        />

        {/* Drop zone */}
        <div
          onDrop={e => handleDrop(e, false)}
          onDragOver={e => { e.preventDefault(); setDragging('public') }}
          onDragLeave={() => setDragging(null)}
          onClick={() => pubPhotos.length < 8 && pubRef.current?.click()}
          className="grid grid-cols-4 gap-2 min-h-24 rounded-2xl p-3 transition-all cursor-pointer"
          style={{
            border: `2px dashed ${dragging === 'public' ? 'var(--gold)' : 'var(--border)'}`,
            background: dragging === 'public' ? 'rgba(201,168,76,0.05)' : 'var(--card2)',
          }}>
          {pubPhotos.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden group"
              onClick={e => e.stopPropagation()}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'var(--gold)', color: 'var(--deep)' }}>
                  ★ Main
                </div>
              )}
              <button
                onClick={() => deletePhoto(url, false)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.7)' }}>
                <X size={12} />
              </button>
            </div>
          ))}
          {pubPhotos.length < 8 && (
            <div className="aspect-square rounded-xl flex flex-col items-center justify-center"
              style={{ border: '1.5px dashed var(--border)', color: 'var(--muted)' }}>
              <Image size={20} className="mb-1" />
              <span className="text-xs">Add</span>
            </div>
          )}
          {pubPhotos.length === 0 && (
            <div className="col-span-4 flex flex-col items-center justify-center py-6 text-center">
              <Upload size={24} className="mb-2" style={{ color: 'var(--muted)' }}/>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Drag & drop or click to upload<br/>
                <span className="text-xs">JPG, PNG, WebP · Max 5MB each</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PRIVATE PHOTOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Lock size={16} style={{ color: 'var(--accent)' }}/>
              Private &quot;One Real&quot; Photos
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,93,38,0.15)', color: 'var(--accent)' }}>
                {privCount}/3
              </span>
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Only unlocked for clients who have a confirmed booking with you.
            </p>
          </div>
          <button
            onClick={() => privRef.current?.click()}
            disabled={uploading || privCount >= 3}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(232,93,38,0.15)',
              color: 'var(--accent)',
              border: '1px solid rgba(232,93,38,0.3)',
              opacity: privCount >= 3 ? 0.5 : 1,
            }}>
            <Lock size={14}/>
            Add Private
          </button>
        </div>

        <input
          ref={privRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => Array.from(e.target.files || []).forEach(f => uploadPhoto(f, true))}
        />

        <div
          onDrop={e => handleDrop(e, true)}
          onDragOver={e => { e.preventDefault(); setDragging('private') }}
          onDragLeave={() => setDragging(null)}
          onClick={() => privCount < 3 && privRef.current?.click()}
          className="rounded-2xl p-4 transition-all cursor-pointer"
          style={{
            border: `2px dashed ${dragging === 'private' ? 'var(--accent)' : 'rgba(232,93,38,0.25)'}`,
            background: dragging === 'private' ? 'rgba(232,93,38,0.05)' : 'rgba(232,93,38,0.03)',
          }}>
          {privCount > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: privCount }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl flex flex-col items-center justify-center relative group"
                  style={{ background: 'rgba(232,93,38,0.1)', border: '1px solid rgba(232,93,38,0.2)' }}>
                  <Lock size={24} style={{ color: 'var(--accent)' }}/>
                  <span className="text-xs mt-1" style={{ color: 'var(--accent)' }}>Private</span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!confirm('Delete this private photo?')) return
                      const res = await fetch('/api/photos/upload', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: `private-${i}`, is_private: true }),
                      })
                      if (res.ok) {
                        setPrivCount(c => c - 1)
                        toast.success('Photo removed')
                      }
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <X size={12}/>
                  </button>
                </div>
              ))}
              {privCount < 3 && (
                <div className="aspect-square rounded-xl flex flex-col items-center justify-center"
                  style={{ border: '1.5px dashed rgba(232,93,38,0.3)', color: 'var(--muted)' }}>
                  <Lock size={18} className="mb-1" style={{ color: 'var(--accent)' }}/>
                  <span className="text-xs">Add</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Lock size={24} className="mb-2" style={{ color: 'var(--accent)' }}/>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Add private &quot;one real&quot; photos here<br/>
                <span className="text-xs">Only visible to clients with confirmed bookings</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 mt-3 p-3 rounded-xl"
          style={{ background: 'rgba(232,93,38,0.06)', border: '1px solid rgba(232,93,38,0.15)' }}>
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }}/>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            Private photos are stored encrypted and only generated as temporary links for clients who book you. They cannot be downloaded or shared outside the platform.
          </p>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(201,168,76,0.08)' }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}/>
          <span className="text-sm" style={{ color: 'var(--gold)' }}>Uploading photo...</span>
        </div>
      )}
    </div>
  )
}
