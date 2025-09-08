'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Check, Sparkles, Zap, Image as ImageIcon, AlertCircle } from 'lucide-react'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  preview?: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [globalStatus, setGlobalStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createFileObject = (file: File): UploadFile => ({
    file,
    id: crypto.randomUUID(),
    progress: 0,
    status: 'uploading',
    preview: URL.createObjectURL(file)
  })

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles = Array.from(fileList)
      .filter(file => file.type.startsWith('image/'))
      .map(createFileObject)

    setFiles(prev => [...prev, ...newFiles])

    // Simulate upload process for each file
    for (const fileObj of newFiles) {
      await uploadFile(fileObj)
    }
  }, [])

  const uploadFile = async (fileObj: UploadFile) => {
    try {
      const formData = new FormData()
      formData.append('file', fileObj.file)

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
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f
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
          <motion.div
            className="inline-flex items-center gap-2 mb-6 card-quantum px-6 py-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles size={20} className="text-electric-blue animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Neural Upload Interface</span>
          </motion.div>

          <motion.h1
            className="font-display text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-holographic">Upload to the Lab</span>
          </motion.h1>

          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Transform your images into extraordinary visual experiences with our revolutionary upload system
          </motion.p>
        </div>

        {/* Upload Interface */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Drag & Drop Zone */}
          <motion.div
            className={`
              card-quantum p-12 text-center mb-8 transition-all duration-500 cursor-pointer
              ${isDragOver ? 'scale-105 shadow-aurora-glow' : 'hover:scale-[1.02]'}
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
                  <div className="w-20 h-20 rounded-full bg-aurora-primary flex items-center justify-center mb-4 animate-glow-pulse">
                    <Zap size={32} className="text-white" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-holographic mb-2">
                    Release to Upload!
                  </h3>
                  <p className="text-gray-600">
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
                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                    Drag & Drop Your Images
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Or click to browse your device
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="glass-subtle rounded-xl px-3 py-1 text-xs text-gray-600">
                      JPG, PNG, WEBP
                    </div>
                    <div className="glass-subtle rounded-xl px-3 py-1 text-xs text-gray-600">
                      Up to 20MB
                    </div>
                    <div className="glass-subtle rounded-xl px-3 py-1 text-xs text-gray-600">
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
                  <h3 className="font-heading text-lg font-bold text-gray-900">
                    Upload Progress
                  </h3>
                  <div className="glass-subtle rounded-xl px-3 py-1 text-xs text-gray-600">
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
                            <ImageIcon size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {fileObj.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-aurora-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${fileObj.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
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
                  <span className="text-sm font-medium text-gray-700">
                    {globalStatus}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
