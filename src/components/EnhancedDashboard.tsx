
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  Mail,
  AlertCircle,
  Settings,
  Users,
  LogOut,
  User,
  Home,
  Search,
  Bell,
  Moon,
  Sun,
  Zap,
  TrendingUp,
  Shield,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { RealTimeNotifications } from '@/components/RealTimeNotifications'

const navigationItems = [
  {
    title: 'Overview',
    icon: Home,
    href: '/dashboard',
    badge: null,
  },
  {
    title: 'Feedback',
    icon: Mail,
    href: '/dashboard/feedback',
    badge: 'new',
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    badge: null,
  },
  {
    title: 'Issues',
    icon: AlertCircle,
    href: '/dashboard/issues',
    badge: 'urgent',
  },
  {
    title: 'Team',
    icon: Users,
    href: '/dashboard/team',
    badge: null,
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    badge: null,
  },
]

function AppSidebar() {
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)
  const { user } = useAuth()

  // Fetch notification counts - RLS automatically filters by user_id
  const { data: notificationCounts } = useQuery({
    queryKey: ['notification-counts'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data: feedbacks } = await supabase
        .from('feedbacks')
        .select('id, processed_at')
        .order('received_at', { ascending: false }) // Uses idx_feedbacks_received_at
        .limit(50)

      const { data: issues } = await supabase
        .from('current_issues')
        .select('id')
        .order('created_at', { ascending: false })

      return {
        newFeedback: feedbacks?.filter(f => !f.processed_at).length || 0,
        urgentIssues: issues?.length || 0,
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user
  })

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                FeedbackFlow
              </span>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  <TrendingUp className="h-2.5 w-2.5 mr-1" />
                  Pro
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href
            let badgeCount = 0
            
            if (item.badge === 'new') badgeCount = notificationCounts?.newFeedback || 0
            if (item.badge === 'urgent') badgeCount = notificationCounts?.urgentIssues || 0

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild className={isActive ? 'bg-primary/10 text-primary' : ''}>
                  <a href={item.href} className="flex items-center justify-between w-full group">
                    <div className="flex items-center space-x-3">
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>{item.title}</span>
                    </div>
                    {badgeCount > 0 && (
                      <Badge 
                        variant={item.badge === 'urgent' ? 'destructive' : 'default'}
                        className="text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </Badge>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>

        {/* Quick Actions */}
        <div className="mt-8 px-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</div>
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Search className="h-4 w-4 mr-2" />
              Search Feedback
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

export const EnhancedDashboard = () => {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [globalSearch, setGlobalSearch] = useState('')

  const getUserInitials = () => {
    if (user?.user_metadata?.username) {
      return user.user_metadata.username.slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const handleGlobalSearch = (query: string) => {
    setGlobalSearch(query)
    // Implement global search functionality
    if (query.length > 2) {
      toast({
        title: "Search initiated",
        description: `Searching for: ${query}`,
      })
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Enhanced Top Navigation */}
          <header className="border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                
                {/* Global Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search everything..."
                    value={globalSearch}
                    onChange={(e) => handleGlobalSearch(e.target.value)}
                    className="pl-10 w-80 bg-muted/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Real-time Notifications */}
                <RealTimeNotifications />

                {/* Performance Indicator */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  All systems operational
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-3">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.username || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-2.5 w-2.5 mr-1" />
                          Verified
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Pro Plan
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/dashboard/settings" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile Settings
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/dashboard/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Preferences
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content with Enhanced Animations */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
