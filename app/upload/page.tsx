'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Check, Sparkles, Zap, Image as ImageIcon, AlertCircle } from 'lucide-react'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  preview?: string
  savedImageId?: string
  // Unified metadata applied (can be changed per file before upload starts in future)
  title?: string
  caption?: string
  tags?: string
  albumId?: string
  alt?: string
  extracted?: {
    title?: string
    caption?: string
    tags?: string
    alt?: string
    license?: string
    attribution?: string
  }
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [globalStatus, setGlobalStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Unified metadata inputs (applied to each file on upload)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')
  const [albumId, setAlbumId] = useState('')
  const [albums, setAlbums] = useState<Array<{ id: string; name: string }>>([])
  const [altText, setAltText] = useState('')
  const [license, setLicense] = useState('')
  const [attribution, setAttribution] = useState('')
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PUBLIC')

  useEffect(() => {
    // fetch album list for selection
    fetch('/api/albums').then(r => r.json()).then(d => setAlbums(d.albums || [])).catch(() => {})
  }, [])

  const createFileObject = useCallback((file: File): UploadFile => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: 'pending',
      preview: URL.createObjectURL(file),
      title: title || undefined,
      caption: caption || undefined,
      tags: tags || undefined,
  albumId: albumId || undefined,
  alt: altText || undefined
    }), [title, caption, tags, albumId, altText])

  const extractAndPopulate = useCallback(async (fileObj: UploadFile) => {
    try {
      const { default: exifr } = await import('exifr') as any
      // exifr.parse returns EXIF + IPTC + XMP when available
      const meta: any = await exifr.parse(fileObj.file, { iptc: true, xmp: true, tiff: true, jfif: true })
      const iptc: any = meta?.iptc || {}
      const exif: any = meta || {}
      const titleFrom = iptc?.ObjectName || iptc?.Title || exif?.ImageDescription || exif?.XPTitle || ''
      const captionFrom = iptc?.Caption || iptc?.CaptionAbstract || exif?.UserComment || ''
      const keywords = Array.isArray(iptc?.Keywords) ? iptc.Keywords : (iptc?.Keywords ? [iptc.Keywords] : [])
      const tagsFrom = keywords.join(', ')
      const copyright = iptc?.CopyrightNotice || exif?.Copyright || ''
      const byline = iptc?.Byline || iptc?.Creator || iptc?.Credit || ''
      const altFrom = captionFrom || titleFrom || ''

      const extracted = {
        title: titleFrom || undefined,
        caption: captionFrom || undefined,
        tags: tagsFrom || undefined,
        alt: altFrom || undefined,
        license: copyright || undefined,
        attribution: byline || undefined,
      }

      // Update the file entry with extracted hints
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, extracted } : f))

      // Auto-populate global fields if empty
      if (!title && extracted.title) setTitle(extracted.title)
      if (!caption && extracted.caption) setCaption(extracted.caption)
      if (!tags && extracted.tags) setTags(extracted.tags)
      if (!altText && extracted.alt) setAltText(extracted.alt)
      if (!license && extracted.license) setLicense(extracted.license)
      if (!attribution && extracted.attribution) setAttribution(extracted.attribution)
    } catch (e) {
      // Best-effort only; ignore failures
    }
  }, [title, caption, tags, altText, license, attribution])

  const handleFiles = useCallback(async (fileList: FileList) => {
    const filesArr = Array.from(fileList)
    const oversize = filesArr.filter(f => f.size > 20 * 1024 * 1024)
    if (oversize.length) {
      setGlobalStatus('Some files exceed 20MB and were skipped.')
    }
    const newFiles = filesArr
      .filter(file => file.type.startsWith('image/') && file.size <= 20 * 1024 * 1024)
      .map(createFileObject)

    setFiles(prev => [...prev, ...newFiles])

    // Extract metadata for each newly added file (non-blocking)
    newFiles.forEach(f => extractAndPopulate(f))
  }, [createFileObject, extractAndPopulate])

  const uploadFile = async (fileObj: UploadFile) => {
    try {
  setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f))
  const formData = new FormData()
  formData.append('file', fileObj.file)
  // Use latest UI state for metadata, with per-file alt override
  if (albumId) formData.append('albumId', albumId)
  if (title) formData.append('title', title)
  if (caption) formData.append('caption', caption)
  if (tags) formData.append('tags', tags)
  if (fileObj.alt || altText) formData.append('alt', (fileObj.alt || altText))
  if (license) formData.append('license', license)
  if (attribution) formData.append('attribution', attribution)
  if (privacy) formData.append('privacy', privacy)

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, progress } : f
        ))
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: formData 
      })

      if (res.ok) {
        const json = await res.json()
        const imageId = json?.image?.id as string | undefined
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'success', progress: 100, savedImageId: imageId } : f
        ))
        setGlobalStatus('Upload successful! ✨')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'error' } : f
      ))
      setGlobalStatus('Upload failed. Please try again.')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      handleFiles(selectedFiles)
    }
  }

  return (
  <div className="relative min-h-screen py-8">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-electric-blue/5 rounded-full blur-3xl animate-particle-float"></div>
        <div className="absolute bottom-1/4 right-1/6 w-48 h-48 bg-neon-pink/5 rounded-full blur-3xl animate-particle-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">

          <motion.h1
            className="font-display text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-holographic">Upload to the Lab</span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Transform your images into extraordinary visual experiences with our revolutionary upload system
          </motion.p>
        </div>

        {/* Unified Upload Interface with metadata */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Metadata Form */}
          <div className="card-quantum p-6 mb-8 space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Image Metadata</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input-neural w-full" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} aria-required="true" />
              <input className="input-neural w-full" placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} />
              <input className="input-neural w-full" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
              <select className="input-neural w-full" value={albumId} onChange={e => setAlbumId(e.target.value)}>
                <option value="">No album</option>
                {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input className="input-neural w-full" placeholder="Alt text (for accessibility)" value={altText} onChange={e => setAltText(e.target.value)} />
              <select className="input-neural w-full" value={privacy} onChange={e => setPrivacy(e.target.value as any)}>
                <option value="PUBLIC">Public</option>
                <option value="UNLISTED">Unlisted</option>
                <option value="PRIVATE">Private</option>
              </select>
              <input className="input-neural w-full" placeholder="License (e.g., CC BY 4.0, All Rights Reserved)" value={license} onChange={e => setLicense(e.target.value)} />
              <input className="input-neural w-full" placeholder="Attribution (author/source)" value={attribution} onChange={e => setAttribution(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Title is required. Privacy, license, alt text, and other values apply to all files in this batch. Max size 20MB per image.</p>
          </div>
          {/* Drag & Drop Zone */}
          <motion.div
            className={`
              card-quantum p-12 text-center mb-8 transition-all duration-500 cursor-pointer
              ${isDragOver ? 'scale-105 shadow-lg shadow-primary/50' : 'hover:scale-[1.02]'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {isDragOver ? (
                <motion.div
                  key="dropping"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4 animate-pulse">
                    <Zap size={32} className="text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-holographic mb-2">
                    Release to Upload!
                  </h3>
                  <p className="text-muted-foreground">
                    Your images are about to become extraordinary
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric-blue/20 to-neon-pink/20 flex items-center justify-center mb-4 animate-pulse">
                    <Upload size={32} className="text-electric-blue" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                    Drag & Drop Your Images
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Or click to browse your device
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="glass-subtle rounded-xl px-3 py-1 text-xs text-muted-foreground">
                      JPG, PNG, WEBP
                    </div>
                    <div className="glass-subtle rounded-xl px-3 py-1 text-xs text-muted-foreground">
                      Up to 20MB
                    </div>
                    <div className="glass-subtle rounded-xl px-3 py-1 text-xs text-muted-foreground">
                      Batch Upload
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Upload Progress */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card-quantum p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    Upload Progress
                  </h3>
                  <div className="glass-subtle rounded-xl px-3 py-1 text-xs text-muted-foreground">
                    {files.length} {files.length === 1 ? 'file' : 'files'}
                  </div>
                </div>

                <div className="space-y-4">
                  {files.map((fileObj) => (
                    <motion.div
                      key={fileObj.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-4 p-4 glass-subtle rounded-2xl"
                    >
                      {/* Preview */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                        {fileObj.preview ? (
                          <img
                            src={fileObj.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={20} className="text-muted-foreground/60" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {fileObj.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        {/* Progress Bar */}
                        {fileObj.status !== 'pending' && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${fileObj.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                        {/* Per-file ALT override */}
                        <div className="mt-3">
                          <input
                            className="input-neural w-full"
                            placeholder="Alt text (override)"
                            value={fileObj.alt || ''}
                            onChange={e => setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, alt: e.target.value } : f))}
                          />
                        </div>
                        {/* Metadata hints (read-only preview) */}
                        {fileObj.extracted && (
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            {fileObj.extracted.title && <div>Title: <span className="text-foreground/80">{fileObj.extracted.title}</span></div>}
                            {fileObj.extracted.caption && <div>Caption: <span className="text-foreground/80">{fileObj.extracted.caption}</span></div>}
                            {fileObj.extracted.tags && <div>Tags: <span className="text-foreground/80">{fileObj.extracted.tags}</span></div>}
                            {(fileObj.extracted.license || fileObj.extracted.attribution) && (
                              <div>Rights: <span className="text-foreground/80">{[fileObj.extracted.license, fileObj.extracted.attribution].filter(Boolean).join(' • ')}</span></div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {fileObj.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                if (!title.trim()) {
                                  setGlobalStatus('Please add a title before saving.');
                                  return;
                                }
                                uploadFile(fileObj)
                              }}
                              className="btn btn-primary px-3 py-2"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => removeFile(fileObj.id)}
                              className="btn-holo ghost px-3 py-2"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {fileObj.status === 'uploading' && (
                          <div className="w-6 h-6 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
                        )}
                        {fileObj.status === 'success' && (
                          <div className="w-6 h-6 rounded-full bg-plasma-green flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                        {fileObj.status === 'error' && (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <AlertCircle size={14} className="text-white" />
                          </div>
                        )}

                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="btn-holo ghost p-2"
                          title="Remove from queue"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Message */}
          <AnimatePresence>
            {globalStatus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 text-center"
              >
                <div className="inline-flex items-center gap-2 card-quantum px-6 py-3">
                  <Sparkles size={16} className="text-electric-blue" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {globalStatus}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save metadata to DB for uploaded images */}
          {files.some(f => f.status === 'success' && f.savedImageId) && (
            <div className="mt-6 flex justify-center">
              <button
                className="btn btn-primary"
                onClick={async () => {
      const done = files.filter(f => f.status === 'success' && f.savedImageId)
                  for (const f of done) {
                    try {
                      await fetch('/api/images/metadata', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          imageId: f.savedImageId,
                          title,
                          caption,
                          tags,
                          alt: f.alt || altText,
                          license,
                          attribution,
        privacy,
        albumId: albumId || null,
                        })
                      })
                    } catch {}
                  }
                  setGlobalStatus('Metadata saved to database.')
                }}
              >
                Save Metadata
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
