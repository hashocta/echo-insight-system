
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import {
  Mail,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  Star,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface DashboardStats {
  totalFeedback: number
  averageRating: number
  weeklyChange: number
  monthlyChange: number
  sentimentDistribution: Array<{ name: string; value: number; color: string }>
  ratingTrends: Array<{ date: string; rating: number }>
  topIssues: Array<{ title: string; count: number }>
  recentFeedback: Array<{
    id: string
    sender_name: string
    subject: string
    average_rating: number
    feedback_summary: string
    received_at: string
  }>
}

export const DashboardOverview = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get user's username from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('email', user.email)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
        return
      }

      const username = userData.username

      // Fetch total feedback count
      const { count: totalFeedback } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('username', username)

      // Fetch recent feedback with ratings
      const { data: feedbackData } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('username', username)
        .order('received_at', { ascending: false })
        .limit(100)

      // Fetch current issues
      const { data: issuesData } = await supabase
        .from('current_issues')
        .select('*')
        .eq('username', username)

      // Calculate statistics
      const recentFeedback = feedbackData?.slice(0, 5) || []
      const ratingsData = feedbackData?.filter(f => f.average_rating) || []
      const averageRating = ratingsData.length > 0 
        ? ratingsData.reduce((sum, f) => sum + (f.average_rating || 0), 0) / ratingsData.length
        : 0

      // Generate sentiment distribution (mock data for demo)
      const sentimentDistribution = [
        { name: 'Positive', value: 45, color: '#22c55e' },
        { name: 'Neutral', value: 35, color: '#f59e0b' },
        { name: 'Negative', value: 20, color: '#ef4444' },
      ]

      // Generate rating trends (mock data for demo)
      const ratingTrends = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rating: Math.random() * 2 + 3, // Random ratings between 3-5
      }))

      // Count issues
      const issueCounts = issuesData?.reduce((acc, issue) => {
        acc[issue.issue_title] = (acc[issue.issue_title] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const topIssues = Object.entries(issueCounts)
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      setStats({
        totalFeedback: totalFeedback || 0,
        averageRating: Number(averageRating.toFixed(1)),
        weeklyChange: Math.random() * 20 - 10, // Mock data
        monthlyChange: Math.random() * 30 - 15, // Mock data
        sentimentDistribution,
        ratingTrends,
        topIssues,
        recentFeedback: recentFeedback.map(f => ({
          id: f.id,
          sender_name: f.sender_name || 'Unknown Sender',
          subject: f.subject || 'No Subject',
          average_rating: f.average_rating || 0,
          feedback_summary: f.feedback_summary || 'No summary available',
          received_at: f.received_at,
        })),
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Feedback",
      value: stats.totalFeedback.toLocaleString(),
      change: stats.weeklyChange,
      icon: Mail,
      description: "This week",
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      change: stats.monthlyChange,
      icon: Star,
      description: "Out of 5.0",
    },
    {
      title: "Response Rate",
      value: "94%",
      change: 5.2,
      icon: TrendingUp,
      description: "Last 30 days",
    },
    {
      title: "Active Issues",
      value: stats.topIssues.length.toString(),
      change: -2.1,
      icon: AlertCircle,
      description: "Being tracked",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your feedback.
          </p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.change > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={stat.change > 0 ? "text-green-500" : "text-red-500"}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="ml-1">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Rating Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Rating Trends</CardTitle>
              <CardDescription>
                Average ratings over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.ratingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sentiment Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Distribution</CardTitle>
              <CardDescription>
                Overall feedback sentiment breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.sentimentDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {stats.sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
              <CardDescription>
                Most frequently reported problems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topIssues.length > 0 ? (
                  stats.topIssues.map((issue, index) => (
                    <div key={issue.title} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Badge variant="outline">{index + 1}</Badge>
                        </div>
                        <span className="font-medium">{issue.title}</span>
                      </div>
                      <Badge>{issue.count} reports</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No issues reported yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>
                  Latest feedback received
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentFeedback.length > 0 ? (
                  stats.recentFeedback.map((feedback) => (
                    <div key={feedback.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(feedback.average_rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {feedback.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          from {feedback.sender_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {feedback.feedback_summary}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(feedback.received_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No feedback received yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
