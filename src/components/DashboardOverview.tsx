
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Mail, TrendingUp, AlertCircle, Star } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export const DashboardOverview = () => {
  // Fetch feedbacks data
  const { data: feedbacks = [], isLoading: feedbacksLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('received_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  // Fetch current issues data
  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ['current_issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('current_issues')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  // Calculate metrics
  const totalFeedback = feedbacks.length
  const averageRating = feedbacks.length > 0 
    ? feedbacks.reduce((sum, feedback) => sum + (Number(feedback.average_rating) || 0), 0) / feedbacks.length
    : 0

  // Prepare sentiment data
  const sentimentData = React.useMemo(() => {
    const positive = feedbacks.filter(f => (Number(f.average_rating) || 0) >= 4).length
    const neutral = feedbacks.filter(f => {
      const rating = Number(f.average_rating) || 0
      return rating >= 2.5 && rating < 4
    }).length
    const negative = feedbacks.filter(f => (Number(f.average_rating) || 0) < 2.5).length

    return [
      { name: 'Positive', value: positive, color: '#00C49F' },
      { name: 'Neutral', value: neutral, color: '#FFBB28' },
      { name: 'Negative', value: negative, color: '#FF8042' }
    ]
  }, [feedbacks])

  // Prepare issues data for chart
  const issuesData = React.useMemo(() => {
    const issueCounts: Record<string, number> = {}
    issues.forEach(issue => {
      issueCounts[issue.issue_title] = (issueCounts[issue.issue_title] || 0) + 1
    })

    return Object.entries(issueCounts).map(([title, count]) => ({
      title,
      count: Number(count)
    }))
  }, [issues])

  const isLoading = feedbacksLoading || issuesLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
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
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Your feedback analytics at a glance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              +0.3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.length}</div>
            <p className="text-xs text-muted-foreground">
              -2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>
              Breakdown of feedback sentiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issues Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Common Issues</CardTitle>
            <CardDescription>
              Most frequently reported issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issuesData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="title" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            Latest feedback received
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbacks.slice(0, 5).map((feedback) => (
              <div key={feedback.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{feedback.sender_name || feedback.sender_email}</span>
                    <Badge variant="outline">{Number(feedback.average_rating || 0).toFixed(1)} ⭐</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{feedback.subject}</p>
                  {feedback.feedback_summary && (
                    <p className="text-sm mt-1">{feedback.feedback_summary}</p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(feedback.received_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {feedbacks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No feedback received yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
