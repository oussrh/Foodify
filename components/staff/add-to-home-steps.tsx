// components/staff/add-to-home-steps.tsx
// Safari's way onto the home screen, as text: an iPhone or iPad has no install prompt, so the only
// way is the Share menu, and the icon is drawn the way Safari draws it. Said by the device sheet's
// install row and by the install invitation, in the same words.
import { Share } from 'lucide-react'

/** The two steps: Share, then "Add to Home Screen". */
export function AddToHomeSteps() {
  return (
    <ol className="list-decimal space-y-1 pl-5">
      <li>
        In Safari, tap Share <Share className="inline h-4 w-4 align-text-bottom" aria-hidden="true" />
        <span className="sr-only">(the square with an arrow pointing up)</span>
      </li>
      <li>Choose “Add to Home Screen”, then open the app from its icon.</li>
    </ol>
  )
}
