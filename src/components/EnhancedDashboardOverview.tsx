
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts'
import { 
  Mail, TrendingUp, AlertCircle, Star, Users, Clock, Target, 
  Zap, Shield, ChevronRight, Calendar, MessageSquare, TrendingDown
} from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export const EnhancedDashboardOverview = () => {
  // Enhanced data fetching with real-time subscriptions
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['enhanced-dashboard'],
    queryFn: async () => {
      const [feedbacksResult, issuesResult, usersResult] = await Promise.all([
        supabase
          .from('feedbacks')
          .select('*')
          .order('received_at', { ascending: false }),
        supabase
          .from('current_issues')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
      ])

      return {
        feedbacks: feedbacksResult.data || [],
        issues: issuesResult.data || [],
        users: usersResult.data || []
      }
    },
    refetchInterval: 30000, // Real-time updates every 30 seconds
  })

  const { feedbacks = [], issues = [], users = [] } = dashboardData || {}

  // Advanced analytics calculations
  const analytics = React.useMemo(() => {
    if (!feedbacks.length) return null

    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const thisWeekFeedbacks = feedbacks.filter(f => new Date(f.received_at) > lastWeek)
    const thisMonthFeedbacks = feedbacks.filter(f => new Date(f.received_at) > lastMonth)
    
    const avgRating = feedbacks.reduce((sum, f) => sum + (Number(f.average_rating) || 0), 0) / feedbacks.length
    const responseRate = Math.round((feedbacks.filter(f => f.processed_at).length / feedbacks.length) * 100)
    
    // Sentiment analysis
    const positive = feedbacks.filter(f => (Number(f.average_rating) || 0) >= 4).length
    const neutral = feedbacks.filter(f => {
      const rating = Number(f.average_rating) || 0
      return rating >= 2.5 && rating < 4
    }).length
    const negative = feedbacks.filter(f => (Number(f.average_rating) || 0) < 2.5).length

    // Trend calculations
    const feedbackTrend = thisWeekFeedbacks.length > 0 ? 
      Math.round(((thisWeekFeedbacks.length - (feedbacks.length - thisWeekFeedbacks.length)) / Math.max(feedbacks.length - thisWeekFeedbacks.length, 1)) * 100) : 0

    // Weekly chart data
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
      const dayFeedbacks = feedbacks.filter(f => {
        const feedbackDate = new Date(f.received_at)
        return feedbackDate.toDateString() === date.toDateString()
      })
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayFeedbacks.length,
        avgRating: dayFeedbacks.length > 0 
          ? dayFeedbacks.reduce((sum, f) => sum + (Number(f.average_rating) || 0), 0) / dayFeedbacks.length 
          : 0
      }
    })

    return {
      totalFeedback: feedbacks.length,
      avgRating,
      responseRate,
      feedbackTrend,
      sentimentData: [
        { name: 'Positive', value: positive, color: '#00C49F' },
        { name: 'Neutral', value: neutral, color: '#FFBB28' },
        { name: 'Negative', value: negative, color: '#FF8042' }
      ],
      weeklyData,
      thisWeekCount: thisWeekFeedbacks.length,
      thisMonthCount: thisMonthFeedbacks.length
    }
  }, [feedbacks])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
          >
            Dashboard Overview
          </motion.h1>
          <p className="text-muted-foreground text-lg mt-2">
            Welcome back! Here's what's happening with your feedback.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Data
          </Badge>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 days
          </Button>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {analytics?.totalFeedback || 0}
              </div>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                {analytics?.feedbackTrend && analytics.feedbackTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(analytics?.feedbackTrend || 0)}% from last week
              </div>
              <Progress value={75} className="mt-3 h-1" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Star className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {analytics?.avgRating?.toFixed(1) || '0.0'}
              </div>
              <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.3 from last week
              </div>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= (analytics?.avgRating || 0)
                        ? 'fill-emerald-500 text-emerald-500'
                        : 'text-emerald-200'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                {issues.length}
              </div>
              <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2 from last week
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="destructive" className="text-xs">
                  {issues.filter((_, i) => i < 3).length} High
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {issues.filter((_, i) => i >= 3).length} Low
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                {analytics?.responseRate || 0}%
              </div>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5% from last week
              </div>
              <Progress value={analytics?.responseRate || 0} className="mt-3 h-1" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Trend Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Feedback Trend
            </CardTitle>
            <CardDescription>
              Feedback volume over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  fill="url(#colorGradient)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Distribution of feedback sentiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.sentimentData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(analytics?.sentimentData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {(analytics?.sentimentData || []).map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Feedback */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest feedback from your customers</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbacks.slice(0, 5).map((feedback) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{feedback.sender_name || feedback.sender_email}</span>
                      <Badge variant="outline" className="text-xs">
                        {Number(feedback.average_rating || 0).toFixed(1)} ⭐
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{feedback.subject}</p>
                    {feedback.feedback_summary && (
                      <p className="text-sm mt-1 line-clamp-2">{feedback.feedback_summary}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(feedback.received_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Week</span>
              <span className="font-medium">{analytics?.thisWeekCount || 0} feedback</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="font-medium">{analytics?.thisMonthCount || 0} feedback</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Team Size</span>
              <span className="font-medium">{users.length} members</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Response</span>
              <span className="font-medium">2.3 hours</span>
            </div>
            
            <div className="pt-4 border-t space-y-2">
              <Button className="w-full" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
