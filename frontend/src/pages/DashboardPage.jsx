import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dashboard } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Users, Phone, CheckCircle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { isAdmin } = useAuthStore()

  // Fetch metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: dashboard.getMetrics,
    refetchInterval: 10000, // Refresh every 10 seconds for near real-time
  })

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboard.getStats,
    refetchInterval: 15000,
  })

  // Fetch audit logs (admin only)
  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => dashboard.getAuditLogs(20),
    enabled: isAdmin(),
    refetchInterval: 30000,
  })

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const metrics = metricsData?.metrics || {}

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Overview of your account activity
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics.totalCalls || 0}</div>
            <p className="text-xs text-muted-foreground">All time calls</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics.completedCalls || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalCalls > 0
                ? `${((metrics.completedCalls / metrics.totalCalls) * 100).toFixed(1)}% success rate`
                : 'No calls yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Calls</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics.activeCalls || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        {isAdmin() && metrics.totalUsers !== null && (
          <Card className="p-3 sm:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="activity" className="text-xs sm:text-sm">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          {isAdmin() && <TabsTrigger value="audit" className="text-xs sm:text-sm">Audit Logs</TabsTrigger>}
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Recent Calls</CardTitle>
              <CardDescription className="text-sm">Latest call activity</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsData?.recentCalls?.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {metricsData.recentCalls.map((call) => (
                    <div key={call._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">Call #{call.ultravoxCallId.slice(-8)}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {call.userId?.email} • {new Date(call.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(call.status)} className="self-start sm:self-center text-xs">
                        {call.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">No calls yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Calls Over Time</CardTitle>
              <CardDescription className="text-sm">Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {statsData?.callsOverTime?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250} className="text-xs sm:text-sm">
                  <BarChart data={statsData.callsOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">No data available</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {statsData?.statusBreakdown?.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {statsData.statusBreakdown.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                        <Badge variant={getStatusVariant(item._id)} className="text-xs">
                          {item._id}
                        </Badge>
                        <span className="font-bold text-sm sm:text-base">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Avg Call Duration</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {metrics.avgCallDuration ? `${Math.round(metrics.avgCallDuration)}s` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Duration</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {metrics.totalCallDuration ? formatDuration(metrics.totalCallDuration) : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isAdmin() && (
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Audit Logs</CardTitle>
                <CardDescription className="text-sm">Security and activity audit trail</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs?.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{log.action}</Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              {log.userId?.email || 'System'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">No audit logs</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
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

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

