import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Search, Filter, Eye, Star, Mail, Calendar, User, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 10

export const FeedbackManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch feedbacks with pagination and filters - RLS automatically filters by user_id
  const { data: feedbackData, isLoading, refetch } = useQuery({
    queryKey: ['feedbacks', currentPage, searchTerm, ratingFilter, dateFilter],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('feedbacks')
        .select('*', { count: 'exact' })
        .order('received_at', { ascending: false }) // Uses idx_feedbacks_received_at index

      // Apply search filter
      if (searchTerm) {
        query = query.or(`subject.ilike.%${searchTerm}%,sender_name.ilike.%${searchTerm}%,sender_email.ilike.%${searchTerm}%`)
      }

      // Apply rating filter
      if (ratingFilter !== 'all') {
        if (ratingFilter === '4+') {
          query = query.gte('average_rating', 4)
        } else if (ratingFilter === '3+') {
          query = query.gte('average_rating', 3).lt('average_rating', 4)
        } else if (ratingFilter === '2+') {
          query = query.gte('average_rating', 2).lt('average_rating', 3)
        } else if (ratingFilter === '1+') {
          query = query.lt('average_rating', 2)
        }
      }

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        if (dateFilter === 'today') {
          startDate.setHours(0, 0, 0, 0)
        } else if (dateFilter === 'week') {
          startDate.setDate(now.getDate() - 7)
        } else if (dateFilter === 'month') {
          startDate.setMonth(now.getMonth() - 1)
        }
        
        query = query.gte('received_at', startDate.toISOString())
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return {
        feedbacks: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      }
    },
    enabled: !!user
  })

  const markAsRead = async (feedbackId: string) => {
    try {
      // Update processed_at timestamp to mark as read
      const { error } = await supabase
        .from('feedbacks')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', feedbackId)

      if (error) throw error

      await refetch()
      toast({
        title: "Marked as read",
        description: "Feedback has been marked as read.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getSentimentBadge = (rating: number | null) => {
    if (!rating) return <Badge variant="outline">Not Rated</Badge>
    
    if (rating >= 4) return <Badge className="bg-green-100 text-green-800">Positive</Badge>
    if (rating >= 2.5) return <Badge className="bg-yellow-100 text-yellow-800">Neutral</Badge>
    return <Badge className="bg-red-100 text-red-800">Negative</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  const { feedbacks = [], totalCount = 0, totalPages = 0 } = feedbackData || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback Management</h1>
        <p className="text-muted-foreground">
          Manage and analyze all your feedback in one place
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4+">4+ Stars</SelectItem>
                <SelectItem value="3+">3-4 Stars</SelectItem>
                <SelectItem value="2+">2-3 Stars</SelectItem>
                <SelectItem value="1+">1-2 Stars</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setRatingFilter('all')
                setDateFilter('all')
                setCurrentPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback ({totalCount})</CardTitle>
          <CardDescription>
            All your received feedback with detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.map((feedback: any) => (
                <TableRow key={feedback.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(feedback.received_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{feedback.sender_name || 'Anonymous'}</div>
                      <div className="text-sm text-muted-foreground">{feedback.sender_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{feedback.subject}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {feedback.average_rating?.toFixed(1) || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSentimentBadge(feedback.average_rating)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedFeedback(feedback)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Feedback Details</DialogTitle>
                            <DialogDescription>
                              Complete feedback information and analysis
                            </DialogDescription>
                          </DialogHeader>
                          <FeedbackDetailView feedback={selectedFeedback} />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => markAsRead(feedback.id)}
                        disabled={!!feedback.processed_at}
                      >
                        {feedback.processed_at ? 'Read' : 'Mark Read'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const FeedbackDetailView = ({ feedback }: { feedback: any }) => {
  if (!feedback) return null

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sender Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{feedback.sender_name || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">{feedback.sender_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  {new Date(feedback.received_at).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {feedback.average_rating?.toFixed(1) || 'Not rated'} / 5.0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  Processed: {feedback.processed_at ? new Date(feedback.processed_at).toLocaleString() : 'Pending'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{feedback.subject || 'No subject'}</p>
        </CardContent>
      </Card>

      {/* Summary */}
      {feedback.feedback_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{feedback.feedback_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Raw Email Data</CardTitle>
          <CardDescription>Complete email information from the webhook</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-60">
            {JSON.stringify(feedback.raw_json, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
