// app/components/ui/attachment-upload.tsx
"use client"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Paperclip, Upload, X, Download, Eye, FileImage, FileText } from "lucide-react"
import Image from "next/image"

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
  disabled?: boolean
  uploading?: boolean
  taskId?: string
}

export function AttachmentUpload({ 
  attachments, 
  onAttachmentsChange, 
  existingAttachments = [],
  disabled = false,
  uploading = false,
  taskId
}: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

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

  const handleDownload = (attachment: Attachment) => {
    // Create a download link for the attachment
    const link = document.createElement('a')
    link.href = `/api/attachments/${attachment.id}/download`
    link.download = attachment.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreview = async (attachment: Attachment) => {
    // Check if the attachment is an image or PDF
    if (attachment.mimeType.startsWith('image/') || attachment.mimeType === 'application/pdf') {
      setLoadingPreview(true)
      setPreviewAttachment(attachment)
      
      try {
        // Fetch the attachment URL for preview
        const response = await fetch(`/api/attachments/${attachment.id}/view`)
        if (response.ok) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
        } else {
          // Fallback to direct path if API fails
          setPreviewUrl(attachment.path)
        }
      } catch (error) {
        console.error('Error previewing attachment:', error)
        // Fallback to direct path if API fails
        setPreviewUrl(attachment.path)
      } finally {
        setLoadingPreview(false)
      }
    } else {
      // For non-image/PDF files, just download them
      handleDownload(attachment)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-4 w-4 text-blue-500" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />
    } else {
      return <Paperclip className="h-4 w-4 text-muted-foreground" />
    }
  }

  const closePreview = () => {
    setPreviewAttachment(null)
    setPreviewUrl(null)
  }

  return (
    <>
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
                <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    {getFileIcon(attachment.mimeType)}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{attachment.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePreview(attachment)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* New attachments (for create/edit pages) */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">New Attachments</h4>
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
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

      {/* Preview Dialog */}
      <Dialog open={!!previewAttachment} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewAttachment?.filename}</DialogTitle>
            <DialogDescription>
              {previewAttachment && formatFileSize(previewAttachment.fileSize)}
            </DialogDescription>
          </DialogHeader>
          
          {loadingPreview ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : previewUrl && previewAttachment ? (
            <div className="flex justify-center">
              {previewAttachment.mimeType.startsWith('image/') ? (
                <Image
                  src={previewUrl}
                  alt={previewAttachment.filename}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : previewAttachment.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh]"
                  title={previewAttachment.filename}
                />
              ) : (
                <div className="text-center py-12">
                  <p>Preview not available for this file type</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => handleDownload(previewAttachment)}
                  >
                    Download File
                  </Button>
                </div>
              )}
            </div>
          ) : null}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closePreview}>
              Close
            </Button>
            {previewAttachment && (
              <Button onClick={() => handleDownload(previewAttachment)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}