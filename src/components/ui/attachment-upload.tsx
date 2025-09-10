// app/components/ui/attachment-upload.tsx
"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Paperclip, Upload, X, Download } from "lucide-react"

interface Attachment {
  id: string
  filename: string
  fileSize: number
  mimeType: string
  path: string
}

interface AttachmentUploadProps {
  attachments: File[]
  onAttachmentsChange: (attachments: File[]) => void
  existingAttachments?: Attachment[]
  onDownload?: (attachment: Attachment) => void
  disabled?: boolean
  uploading?: boolean
}

export function AttachmentUpload({ 
  attachments, 
  onAttachmentsChange, 
  existingAttachments = [],
  onDownload,
  disabled = false,
  uploading = false
}: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      onAttachmentsChange([...attachments, ...newFiles])
    }
  }

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    onAttachmentsChange(newAttachments)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments
        </CardTitle>
        <CardDescription>
          Add files and documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={triggerFileInput}
          disabled={disabled || uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
        
        {/* Existing attachments (for view/edit pages) */}
        {existingAttachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Attachments</h4>
            {existingAttachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{attachment.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>
                {onDownload && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* New attachments (for create/edit pages) */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">New Attachments</h4>
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveAttachment(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}