// components/capture/use-capture-upload.ts
// Sending the video and the photos straight to the capture engine, each on the address the server
// signed for it, one after the other, with one progress bar over all the bytes: XMLHttpRequest,
// because fetch cannot report an upload's progress. Leaving the dialog cancels a send in flight.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** `progress` 0-100 over every file (null when idle), `send(urls, files)` true once the engine has them all. */
export function useCaptureUpload() {
  const [progress, setProgress] = useState<number | null>(null)
  const request = useRef<XMLHttpRequest | null>(null)

  const sendOne = useCallback(
    (url: string, file: File, onBytes: (loaded: number) => void) =>
      new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest()
        request.current = xhr
        xhr.upload.onprogress = (event) => onBytes(event.loaded)
        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
        xhr.onerror = xhr.onabort = () => resolve(false)
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.send(file)
      }),
    [],
  )

  const send = useCallback(
    async (urls: string[], files: File[]) => {
      const total = files.reduce((sum, file) => sum + file.size, 0) || 1
      let sent = 0
      setProgress(0)
      for (const [index, file] of files.entries()) {
        const url = urls[index]
        const ok = url !== undefined && (await sendOne(url, file, (loaded) => setProgress(Math.round(((sent + loaded) / total) * 100))))
        if (!ok) break
        sent += file.size
      }
      request.current = null
      setProgress(null)
      return sent === files.reduce((sum, file) => sum + file.size, 0)
    },
    [sendOne],
  )

  useEffect(() => () => request.current?.abort(), [])
  return { progress, send }
}
