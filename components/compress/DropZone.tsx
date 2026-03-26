'use client'

import { useRef, useState } from 'react'
import { MAX_FILE_BYTES } from '@/lib/api'

interface Props {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function DropZone({ onFiles, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handle(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter((f) => {
      if (f.size > MAX_FILE_BYTES) {
        alert(`${f.name} exceeds 50MB limit`)
        return false
      }
      return true
    })
    if (valid.length) onFiles(valid)
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) handle(e.dataTransfer.files)
      }}
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors select-none ${
        dragging ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300 hover:border-neutral-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <p className="text-sm text-neutral-500">
        Drop images here or <span className="underline">click to browse</span>
      </p>
      <p className="text-xs text-neutral-400 mt-1">Max 50MB per file</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  )
}
