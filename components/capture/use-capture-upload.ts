// components/capture/use-capture-upload.ts
// Sending the video and the photos straight to the capture engine, each on the address the server
// signed for it, one after the other, in pieces (lib/capture-pieces.ts: a web request on Modal ends
// at 150 s), with one progress bar over all the bytes. A piece that fails is sent again, up to
// three times, so a dropped connection costs seconds rather than the whole video.
// XMLHttpRequest, because fetch cannot report an upload's progress. Leaving the dialog cancels a
// send in flight.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { pieces } from '@/lib/capture-pieces'

const ATTEMPTS = 3

/** `progress` 0-100 over every file (null when idle), `send(urls, files)` true once the engine has them all. */
export function useCaptureUpload() {
  const [progress, setProgress] = useState<number | null>(null)
  const request = useRef<XMLHttpRequest | null>(null)
  const cancelled = useRef(false)

  const sendPiece = useCallback(
    (url: string, body: Blob, onBytes: (loaded: number) => void) =>
      new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest()
        request.current = xhr
        xhr.upload.onprogress = (event) => onBytes(event.loaded)
        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
        xhr.onerror = xhr.onabort = () => resolve(false)
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', 'application/octet-stream')
        xhr.send(body)
      }),
    [],
  )

  const sendFile = useCallback(
    async (url: string, file: File, onBytes: (loaded: number) => void) => {
      for (const piece of pieces(url, file.size)) {
        let ok = false
        for (let attempt = 0; attempt < ATTEMPTS && !ok && !cancelled.current; attempt++) {
          ok = await sendPiece(piece.url, file.slice(piece.start, piece.end), (loaded) => onBytes(piece.start + loaded))
        }
        if (!ok) return false
      }
      return true
    },
    [sendPiece],
  )

  const send = useCallback(
    async (urls: string[], files: File[]) => {
      const total = files.reduce((sum, file) => sum + file.size, 0) || 1
      let sent = 0
      cancelled.current = false
      setProgress(0)
      for (const [index, file] of files.entries()) {
        const url = urls[index]
        const ok = url !== undefined && (await sendFile(url, file, (loaded) => setProgress(Math.round(((sent + loaded) / total) * 100))))
        if (!ok) break
        sent += file.size
      }
      request.current = null
      setProgress(null)
      return sent === files.reduce((sum, file) => sum + file.size, 0)
    },
    [sendFile],
  )

  useEffect(
    () => () => {
      cancelled.current = true
      request.current?.abort()
    },
    [],
  )
  return { progress, send }
}
