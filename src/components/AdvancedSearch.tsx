
import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Search, Filter, X, Calendar, Star, Mail, AlertCircle, 
  SortAsc, SortDesc, Clock, User, Tag, TrendingUp 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { debounce } from 'lodash'

interface SearchFilters {
  query: string
  rating: string
  dateRange: string
  sender: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  category: string
}

export const AdvancedSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    rating: 'all',
    dateRange: 'all',
    sender: '',
    sortBy: 'received_at',
    sortOrder: 'desc',
    category: 'all'
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { toast } = useToast()

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      // Trigger search with debounced filters
    }, 300),
    []
  )

  // Advanced search query
  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ['advanced-search', filters],
    queryFn: async () => {
      let query = supabase
        .from('feedbacks')
        .select(`
          *,
          current_issues (
            issue_title
          )
        `)

      // Apply text search
      if (filters.query) {
        query = query.or(`
          subject.ilike.%${filters.query}%,
          sender_name.ilike.%${filters.query}%,
          sender_email.ilike.%${filters.query}%,
          feedback_summary.ilike.%${filters.query}%
        `)
      }

      // Apply rating filter
      if (filters.rating !== 'all') {
        if (filters.rating === '5') {
          query = query.gte('average_rating', 4.5)
        } else if (filters.rating === '4') {
          query = query.gte('average_rating', 3.5).lt('average_rating', 4.5)
        } else if (filters.rating === '3') {
          query = query.gte('average_rating', 2.5).lt('average_rating', 3.5)
        } else if (filters.rating === '2') {
          query = query.gte('average_rating', 1.5).lt('average_rating', 2.5)
        } else if (filters.rating === '1') {
          query = query.lt('average_rating', 1.5)
        }
      }

      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case '3months':
            startDate.setMonth(now.getMonth() - 3)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        query = query.gte('received_at', startDate.toISOString())
      }

      // Apply sender filter
      if (filters.sender) {
        query = query.or(`
          sender_name.ilike.%${filters.sender}%,
          sender_email.ilike.%${filters.sender}%
        `)
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })

      const { data, error } = await query.limit(50)
      if (error) throw error

      return data || []
    },
    enabled: Object.values(filters).some(v => v !== '' && v !== 'all'),
  })

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    debouncedSearch(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      rating: 'all',
      dateRange: 'all',
      sender: '',
      sortBy: 'received_at',
      sortOrder: 'desc' as const,
      category: 'all'
    }
    setFilters(clearedFilters)
  }

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => 
      value !== '' && value !== 'all' && key !== 'sortBy' && key !== 'sortOrder'
    ).length
  }, [filters])

  const getSearchSuggestions = () => {
    // Mock search suggestions - in real app, this would come from your backend
    return [
      'login issues',
      'payment problems',
      'slow loading',
      'bug report',
      'feature request'
    ]
  }

  return (
    <div className="space-y-6">
      {/* Main Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback, issues, or senders..."
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="pl-10 pr-10"
              />
              {filters.query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => updateFilter('query', '')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Search Suggestions */}
          {filters.query === '' && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">Popular searches:</div>
              <div className="flex flex-wrap gap-2">
                {getSearchSuggestions().map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter('query', suggestion)}
                    className="text-xs"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rating</label>
                    <Select value={filters.rating} onValueChange={(value) => updateFilter('rating', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="3months">Last 3 Months</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received_at">Date Received</SelectItem>
                        <SelectItem value="average_rating">Rating</SelectItem>
                        <SelectItem value="sender_name">Sender Name</SelectItem>
                        <SelectItem value="subject">Subject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Order</label>
                    <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">
                          <div className="flex items-center gap-2">
                            <SortDesc className="h-4 w-4" />
                            Descending
                          </div>
                        </SelectItem>
                        <SelectItem value="asc">
                          <div className="flex items-center gap-2">
                            <SortAsc className="h-4 w-4" />
                            Ascending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sender Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sender</label>
                  <Input
                    placeholder="Filter by sender name or email..."
                    value={filters.sender}
                    onChange={(e) => updateFilter('sender', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      {(searchResults || isLoading) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Search Results</span>
              {searchResults && (
                <Badge variant="outline">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{result.sender_name || result.sender_email}</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {Number(result.average_rating || 0).toFixed(1)}
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-1">{result.subject}</h4>
                        {result.feedback_summary && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.feedback_summary}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(result.received_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {result.sender_email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
