'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, Clock, Check, Copy, Loader2 } from 'lucide-react'
import { createTemporaryAccessTokenAction } from '@/app/actions/temporary-access-actions'
import { toast } from 'sonner'

interface SharePrescriptionDialogProps {
  medicalRecordId: string
}

export function SharePrescriptionDialog({ medicalRecordId }: SharePrescriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState(30) // Default 30 minutes
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    const res = await createTemporaryAccessTokenAction(medicalRecordId, duration)
    setLoading(false)

    if (res.success && res.tokenId) {
      const url = `${window.location.origin}/share/${res.tokenId}`
      setShareUrl(url)
    } else {
      toast.error('Failed to generate access: ' + res.error)
    }
  }

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copied to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) {
        setShareUrl(null)
      }
    }}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Prescription</DialogTitle>
          <DialogDescription>
            Generate a temporary access link and QR code for this prescription.
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Access Duration (minutes)</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="1440" // 24 hours
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The link will automatically expire after this time.
              </p>
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate Link
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="bg-white p-4 rounded-lg shadow-inner border">
              <QRCodeSVG value={shareUrl} size={200} />
            </div>
            
            <div className="w-full space-y-2">
              <Label>Access Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly />
                <Button variant="secondary" size="icon" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              This link will expire in <span className="font-bold">{duration} minutes</span>.
            </p>
            
            <Button variant="outline" className="w-full" onClick={() => setShareUrl(null)}>
              Generate New Link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
