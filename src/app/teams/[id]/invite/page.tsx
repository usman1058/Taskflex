"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const teamId = params.id as string
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    const acceptInvitation = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid invitation link')
        return
      }
      
      try {
        const response = await fetch(`/api/teams/${teamId}/invite/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })
        
        if (response.ok) {
          setStatus('success')
          setMessage('You have successfully joined the team!')
          setTimeout(() => router.push(`/teams/${teamId}`), 3000)
        } else {
          const data = await response.json()
          setStatus('error')
          setMessage(data.error || 'Failed to accept invitation')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred while accepting the invitation')
      }
    }
    
    acceptInvitation()
  }, [token, teamId, router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your invitation...'}
            {status === 'success' && 'Invitation Accepted!'}
            {status === 'error' && 'Invitation Failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
          {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
          {status === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
          
          <p className="text-center text-sm text-muted-foreground">
            {message}
          </p>
          
          {status === 'error' && (
            <Button onClick={() => router.push('/teams')}>
              Back to Teams
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}