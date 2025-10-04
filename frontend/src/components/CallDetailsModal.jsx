import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { calls } from '@/lib/api'
import { X, ExternalLink, Loader2 } from 'lucide-react'

export default function CallDetailsModal({ call, onClose }) {
  // Fetch real-time status
  const { data: statusData, refetch } = useQuery({
    queryKey: ['call-status', call._id],
    queryFn: () => calls.getStatus(call._id),
    refetchInterval: 3000, // Poll every 3 seconds
  })

  // Fetch transcript if call is completed
  const { data: transcriptData } = useQuery({
    queryKey: ['call-transcript', call._id],
    queryFn: () => calls.getTranscript(call._id),
    enabled: statusData?.status === 'completed',
  })

  useEffect(() => {
    // Refetch status when modal opens
    refetch()
  }, [call._id, refetch])

  const currentStatus = statusData?.status || call.status
  const isActive = ['queued', 'ringing', 'in_progress'].includes(currentStatus)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
         onClick={onClose}>
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-background border-b p-4 sm:p-6 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold truncate">Call Details</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              ID: {call.ultravoxCallId}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 ml-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl">Status</CardTitle>
                {isActive && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <Badge variant={getStatusVariant(currentStatus)} className="text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2 self-start">
                  {currentStatus}
                </Badge>
                {statusData?.duration && (
                  <span className="text-sm sm:text-base text-muted-foreground">
                    Duration: {statusData.duration}s
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Created</p>
                  <p className="font-medium text-sm sm:text-base truncate">{new Date(call.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">User</p>
                  <p className="font-medium text-sm sm:text-base truncate">{call.userId?.email}</p>
                </div>
              </div>
              {call.metadata?.joinUrl && (
                <div className="pt-2">
                  <a
                    href={call.metadata.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2 text-sm sm:text-base"
                  >
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Join Call URL
                  </a>
                </div>
              )}
              {statusData?.recordingUrl && (
                <div className="pt-2">
                  <a
                    href={statusData.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2 text-sm sm:text-base"
                  >
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Recording URL
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events */}
          {statusData?.events && statusData.events.length > 0 && (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Events</CardTitle>
                <CardDescription className="text-sm">Call event timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {statusData.events.map((event, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded gap-2">
                      <Badge variant="outline" className="text-xs self-start">{event.type}</Badge>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          {transcriptData?.transcript && (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                {typeof transcriptData.transcript === 'string' ? (
                  <div className="space-y-3 sm:space-y-4">
                    {JSON.parse(transcriptData.transcript).map((line, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Badge
                          variant={line.speaker === 'AI' ? 'default' : 'secondary'}
                          className="text-xs self-start"
                        >
                          {line.speaker}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base break-words">{line.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{line.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Transcript not available</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusVariant(status) {
  switch (status) {
    case 'completed':
      return 'default'
    case 'failed':
      return 'destructive'
    case 'in_progress':
    case 'ringing':
      return 'secondary'
    default:
      return 'outline'
  }
}

