
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertCircle, Plus, Trash2, Edit, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const IssuesTracking = () => {
  const [newIssueTitle, setNewIssueTitle] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch issues
  const { data: issues = [], isLoading } = useQuery({
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

  // Fetch related feedback for each issue
  const { data: feedbackCounts = {} } = useQuery({
    queryKey: ['issue-feedback-counts'],
    queryFn: async () => {
      const { data: feedbacks, error } = await supabase
        .from('feedbacks')
        .select('feedback_summary')
      
      if (error) throw error
      
      // Count feedback related to each issue (simplified matching)
      const counts: Record<string, number> = {}
      issues.forEach(issue => {
        counts[issue.id] = feedbacks?.filter(f => 
          f.feedback_summary?.toLowerCase().includes(issue.issue_title.toLowerCase())
        ).length || 0
      })
      
      return counts
    },
    enabled: issues.length > 0
  })

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!user?.user_metadata?.username) {
        throw new Error('Username not found')
      }

      const { data, error } = await supabase
        .from('current_issues')
        .insert({
          username: user.user_metadata.username,
          issue_title: title
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current_issues'] })
      setNewIssueTitle('')
      setIsCreateDialogOpen(false)
      toast({
        title: "Issue created",
        description: "New issue has been added to tracking.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  // Delete issue mutation
  const deleteIssueMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const { error } = await supabase
        .from('current_issues')
        .delete()
        .eq('id', issueId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current_issues'] })
      toast({
        title: "Issue deleted",
        description: "Issue has been removed from tracking.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const handleCreateIssue = () => {
    if (!newIssueTitle.trim()) return
    createIssueMutation.mutate(newIssueTitle.trim())
  }

  const handleDeleteIssue = (issueId: string) => {
    if (confirm('Are you sure you want to delete this issue?')) {
      deleteIssueMutation.mutate(issueId)
    }
  }

  const getIssuePriority = (feedbackCount: number) => {
    if (feedbackCount >= 10) return { level: 'High', color: 'bg-red-100 text-red-800' }
    if (feedbackCount >= 5) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'Low', color: 'bg-green-100 text-green-800' }
  }

  const getIssueAge = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issues Tracking</h1>
          <p className="text-muted-foreground">
            Track and manage common issues from your feedback
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Issue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Issue</DialogTitle>
              <DialogDescription>
                Add a new issue to track from your feedback
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="issue-title" className="text-sm font-medium">
                  Issue Title
                </label>
                <Input
                  id="issue-title"
                  placeholder="e.g., Login Problems, Slow Performance"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateIssue()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateIssue}
                  disabled={!newIssueTitle.trim() || createIssueMutation.isPending}
                >
                  Create Issue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.length}</div>
            <p className="text-xs text-muted-foreground">
              Active tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issues.filter(issue => 
                getIssuePriority(feedbackCounts[issue.id] || 0).level === 'High'
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issues.filter(issue => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(issue.created_at) > weekAgo
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              New issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2d</div>
            <p className="text-xs text-muted-foreground">
              Time to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {issues.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No issues tracked yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start tracking common issues from your feedback to better understand user concerns.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Issue
              </Button>
            </CardContent>
          </Card>
        ) : (
          issues.map((issue) => {
            const feedbackCount = feedbackCounts[issue.id] || 0
            const priority = getIssuePriority(feedbackCount)
            
            return (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{issue.issue_title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created {getIssueAge(issue.created_at)}</span>
                        <span>•</span>
                        <span>Reported by {issue.username}</span>
                        <span>•</span>
                        <span>{feedbackCount} related feedback(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priority.color}>
                        {priority.level} Priority
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteIssue(issue.id)}
                        disabled={deleteIssueMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Impact: {feedbackCount > 0 ? 'Active' : 'Monitoring'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Status: Open
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View Related Feedback
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
