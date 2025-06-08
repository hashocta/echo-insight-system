
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { TrendingUp, TrendingDown, Calendar, Star, MessageSquare, Users, Clock, Target } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export const Analytics = () => {
  // Fetch analytics data
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['analytics-feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('received_at', { ascending: true })
      
      if (error) throw error
      return data || []
    }
  })

  const { data: issues = [] } = useQuery({
    queryKey: ['analytics-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('current_issues')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  // Process data for charts
  const chartData = React.useMemo(() => {
    if (!feedbacks.length) return null

    // Time series data
    const timeSeriesData = feedbacks.reduce((acc: any[], feedback) => {
      const date = new Date(feedback.received_at).toLocaleDateString()
      const existing = acc.find(item => item.date === date)
      
      if (existing) {
        existing.count += 1
        existing.totalRating += Number(feedback.average_rating) || 0
        existing.avgRating = existing.totalRating / existing.count
      } else {
        acc.push({
          date,
          count: 1,
          totalRating: Number(feedback.average_rating) || 0,
          avgRating: Number(feedback.average_rating) || 0
        })
      }
      
      return acc
    }, [])

    // Sentiment distribution
    const sentimentData = [
      { 
        name: 'Positive', 
        value: feedbacks.filter(f => (Number(f.average_rating) || 0) >= 4).length,
        color: '#00C49F'
      },
      { 
        name: 'Neutral', 
        value: feedbacks.filter(f => {
          const rating = Number(f.average_rating) || 0
          return rating >= 2.5 && rating < 4
        }).length,
        color: '#FFBB28'
      },
      { 
        name: 'Negative', 
        value: feedbacks.filter(f => (Number(f.average_rating) || 0) < 2.5).length,
        color: '#FF8042'
      }
    ]

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating: `${rating} Star${rating > 1 ? 's' : ''}`,
      count: feedbacks.filter(f => {
        const avgRating = Number(f.average_rating) || 0
        return Math.floor(avgRating) === rating || (rating === 5 && avgRating > 4.5)
      }).length
    }))

    // Weekly trend
    const weeklyData = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString()
      
      const dayFeedbacks = feedbacks.filter(f => 
        new Date(f.received_at).toLocaleDateString() === dateStr
      )
      
      weeklyData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        feedback: dayFeedbacks.length,
        avgRating: dayFeedbacks.length > 0 
          ? dayFeedbacks.reduce((sum, f) => sum + (Number(f.average_rating) || 0), 0) / dayFeedbacks.length
          : 0
      })
    }

    // Hour distribution
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourFeedbacks = feedbacks.filter(f => 
        new Date(f.received_at).getHours() === hour
      )
      
      return {
        hour: `${hour}:00`,
        count: hourFeedbacks.length
      }
    })

    return {
      timeSeriesData,
      sentimentData,
      ratingDistribution,
      weeklyData,
      hourlyData
    }
  }, [feedbacks])

  const stats = React.useMemo(() => {
    if (!feedbacks.length) return null

    const totalFeedback = feedbacks.length
    const avgRating = feedbacks.reduce((sum, f) => sum + (Number(f.average_rating) || 0), 0) / totalFeedback
    const responseRate = Math.round(Math.random() * 20 + 80) // Mock data
    const avgResponseTime = Math.round(Math.random() * 4 + 2) // Mock data

    // Calculate trends (mock data for demo)
    const feedbackTrend = Math.round(Math.random() * 40 - 20)
    const ratingTrend = (Math.random() - 0.5) * 2
    const responseRateTrend = Math.round(Math.random() * 10 - 5)

    return {
      totalFeedback,
      avgRating,
      responseRate,
      avgResponseTime,
      feedbackTrend,
      ratingTrend,
      responseRateTrend,
      totalIssues: issues.length
    }
  }, [feedbacks, issues])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!chartData || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">No data available yet</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Advanced insights into your feedback data
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedback}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.feedbackTrend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(stats.feedbackTrend)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.ratingTrend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(stats.ratingTrend).toFixed(1)} from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.responseRateTrend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(stats.responseRateTrend)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}h</div>
            <p className="text-xs text-muted-foreground">
              -30min from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Feedback Trend</CardTitle>
            <CardDescription>
              Feedback volume and average rating over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="feedback"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#ff7300"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>
              Breakdown of positive, neutral, and negative feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>
              How ratings are distributed across all feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback by Hour</CardTitle>
            <CardDescription>
              When do you receive the most feedback?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Timeline</CardTitle>
          <CardDescription>
            Daily feedback volume and average rating over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="count" fill="#8884d8" fillOpacity={0.3} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgRating"
                stroke="#ff7300"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
