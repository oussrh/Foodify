'use client'

// The reading matter of the QR dialog: what the guest and the restaurant get, how to set the
// code up and promote it, and the file's technical details. All static.
import { Camera, CheckCircle, Eye, Globe, Info, Mail, MessageSquare, Printer, Smartphone, Sparkles, Star, Users, Zap } from 'lucide-react'

export function FeaturesGrid() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 border border-border rounded-md">
        <h4 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Customer Experience
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            <span>Mobile-optimized digital menu</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span>Interactive AR dish visualization</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Real-time menu updates</span>
          </div>
        </div>
      </div>

      <div className="p-4 border border-border rounded-md">
        <h4 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Business Benefits
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>Contactless menu access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span>Instant menu updates</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>Enhanced customer engagement</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Enhanced Instructions */
export function InstructionsGrid() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 border border-border rounded-md">
        <h4 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Setup Instructions
        </h4>
        <ol className="text-sm text-muted-foreground dark:text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 bg-muted text-muted-foreground dark:text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Download the HD QR code</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 bg-muted text-muted-foreground dark:text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Print and place on tables or entrance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 bg-muted text-muted-foreground dark:text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Customers scan to access digital menu</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 bg-muted text-muted-foreground dark:text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>They can explore dishes in AR</span>
          </li>
        </ol>
      </div>

      <div className="p-4 border border-border rounded-md">
        <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Marketing Tips
        </h4>
        <ul className="text-sm text-success dark:text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Add &ldquo;Scan for AR Menu&rdquo; signage</span>
          </li>
          <li className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Include QR in social media posts</span>
          </li>
          <li className="flex items-start gap-2">
            <Star className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Highlight AR features to customers</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Train staff on digital menu benefits</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export function TechnicalInfo() {
  return (
    <div className="p-4 bg-muted border border-border rounded-md">
      <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
        <Info className="h-4 w-4" />
        Technical Information
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-medium">Format:</span>
          <br />
          <span>PNG High Quality</span>
        </div>
        <div>
          <span className="font-medium">Size:</span>
          <br />
          <span>1200×1200 pixels</span>
        </div>
        <div>
          <span className="font-medium">Error Correction:</span>
          <br />
          <span>Medium Level</span>
        </div>
        <div>
          <span className="font-medium">Compatibility:</span>
          <br />
          <span>All QR scanners</span>
        </div>
      </div>
    </div>
  )
}
