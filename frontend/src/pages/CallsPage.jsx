import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calls } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Phone, PlayCircle, Loader2, ExternalLink } from 'lucide-react'
import CallDetailsModal from '@/components/CallDetailsModal'

export default function CallsPage() {
  const queryClient = useQueryClient()
  const [selectedCall, setSelectedCall] = useState(null)
  const { tenant } = useAuthStore()

  // Debug tenant information
  console.log('🔍 CallsPage - Tenant info:', {
    tenant,
    tenantId: tenant?.id,
    tenantName: tenant?.name,
    isAuthenticated: !!useAuthStore.getState().token
  })

  // Fetch all calls
  const { data: callsData, isLoading } = useQuery({
    queryKey: ['calls'],
    queryFn: calls.getAll,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  // Create call mutation
  const createCallMutation = useMutation({
    mutationFn: async () => {
      // Ensure tenant information is available
      if (!tenant?.id) {
        throw new Error('Tenant information not available. Please refresh the page and try again.');
      }

      console.log('🔗 Creating call with tenantId:', tenant.id);

      return calls.create({
        systemPrompt: 'You are a helpful AI assistant for customer support.',
        model: 'fixie-ai/ultravox',
        voice: 'default',
        tenantId: tenant.id, // Include tenantId for backend validation
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calls'])
      queryClient.invalidateQueries(['dashboard-metrics'])
    },
  })

  const handleCreateCall = () => {
    createCallMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading calls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Calls</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Manage your Ultravox API calls
          </p>
        </div>
        <Button
          onClick={handleCreateCall}
          disabled={createCallMutation.isPending}
          size="sm"
          className="w-full sm:w-auto sm:size-lg"
        >
          {createCallMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Call...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Make Test Call
            </>
          )}
        </Button>
      </div>

      {createCallMutation.isError && (
        <Card className="border-destructive">
          <CardContent className="p-3 sm:p-6">
            <p className="text-destructive text-sm sm:text-base">
              Error creating call: {createCallMutation.error.message}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 sm:space-y-4">
        {callsData?.length > 0 ? (
          callsData.map((call) => (
            <Card key={call._id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedCall(call)}>
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">
                        Call #{call.ultravoxCallId.slice(-8)}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Created: {new Date(call.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <CallStatusBadge status={call.status} />
                    {call.status === 'in_progress' && (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className="font-medium capitalize truncate">{call.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="font-medium truncate">
                      {call.duration ? `${call.duration}s` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Events</p>
                    <p className="font-medium truncate">{call.events?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">User</p>
                    <p className="font-medium truncate">{call.userId?.email || 'N/A'}</p>
                  </div>
                </div>
                {call.metadata?.joinUrl && (
                  <div className="mt-3 sm:mt-4">
                    <a
                      href={call.metadata.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Join Call <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <Phone className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-lg sm:text-xl font-medium mb-2 text-center">No calls yet</p>
              <p className="text-muted-foreground text-center text-sm sm:text-base mb-4 px-4">
                Click &ldquo;Make Test Call&rdquo; to create your first call
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  )
}

function CallStatusBadge({ status }) {
  const variants = {
    queued: 'outline',
    ringing: 'secondary',
    in_progress: 'secondary',
    completed: 'default',
    failed: 'destructive',
    ended: 'outline',
  }

  return (
    <Badge variant={variants[status] || 'outline'} className="capitalize">
      {status.replace('_', ' ')}
    </Badge>
  )
}

