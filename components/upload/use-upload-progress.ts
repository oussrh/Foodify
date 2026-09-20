'use client'

// The state of one upload as the four upload components show it: a busy flag, a simulated
// progress bar (a random step toward 90% every tick while the request is pending, 100 when it
// resolves, reset a second after either outcome), and the success or error line. The run's
// order is the one each component had: the upload, then what the caller does with its result,
// both inside the same try so a failure anywhere shows the caller's message.
import { useState } from 'react'

export interface UploadRun<T> {
  upload: () => Promise<T>
  /** Runs once the bar is at 100: the callback to the form, the saved copy, the success line. */
  onUploaded: (result: T) => void | Promise<void>
  /** The error line for whatever `upload` or `onUploaded` threw. */
  failure: (err: unknown) => string
  /** Runs with the reset, a second after the run ends either way. */
  onSettled?: () => void
}

export function useUploadProgress(tickMs: number) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /** Shows a success line and clears it after `ms`. */
  const flashSuccess = (message: string, ms: number) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), ms)
  }

  const track = async <T,>(run: UploadRun<T>) => {
    setIsUploading(true)
    setError(null)
    setSuccess(null)
    setUploadProgress(0)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 20
        return newProgress > 90 ? 90 : newProgress
      })
    }, tickMs)

    try {
      const result = await run.upload()

      clearInterval(progressInterval)
      setUploadProgress(100)

      await run.onUploaded(result)
    } catch (err) {
      clearInterval(progressInterval)
      console.error('Upload error:', err)
      setError(run.failure(err))
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        run.onSettled?.()
      }, 1000)
    }
  }

  return { isUploading, uploadProgress, error, success, setError, setSuccess, flashSuccess, track }
}
