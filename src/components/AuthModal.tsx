
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, X, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>
type ResetFormData = z.infer<typeof resetSchema>

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode,
  onModeChange,
}) => {
  const [currentView, setCurrentView] = useState<'auth' | 'reset'>('auth')
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const { signUp, signIn, resetPassword, checkUsernameAvailability } = useAuth()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const username = registerForm.watch('username')

  useEffect(() => {
    if (mode === 'register' && username && username.length >= 3) {
      if (checkTimeout) {
        clearTimeout(checkTimeout)
      }

      setUsernameStatus('checking')
      const timeout = setTimeout(async () => {
        try {
          const isAvailable = await checkUsernameAvailability(username)
          setUsernameStatus(isAvailable ? 'available' : 'taken')
        } catch (error) {
          setUsernameStatus('idle')
        }
      }, 500)

      setCheckTimeout(timeout)
    } else {
      setUsernameStatus('idle')
    }

    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout)
      }
    }
  }, [username, mode, checkUsernameAvailability])

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      await signIn(data.email, data.password)
      onClose()
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const onRegisterSubmit = async (data: RegisterFormData) => {
    if (usernameStatus !== 'available') {
      return
    }

    setLoading(true)
    try {
      await signUp(data.email, data.password, data.username)
      onClose()
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const onResetSubmit = async (data: ResetFormData) => {
    setLoading(true)
    try {
      await resetPassword(data.email)
      setCurrentView('auth')
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const getUsernameIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      case 'available':
        return <Check className="h-4 w-4 text-green-500" />
      case 'taken':
        return <X className="h-4 w-4 text-destructive" />
      default:
        return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getUsernameBadge = () => {
    switch (usernameStatus) {
      case 'available':
        return <Badge variant="outline" className="text-green-600 border-green-600">Available</Badge>
      case 'taken':
        return <Badge variant="destructive">Taken</Badge>
      default:
        return null
    }
  }

  const resetModal = () => {
    setCurrentView('auth')
    loginForm.reset()
    registerForm.reset()
    resetForm.reset()
    setUsernameStatus('idle')
  }

  useEffect(() => {
    if (!isOpen) {
      resetModal()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {currentView === 'auth' ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-center">
                  {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {mode === 'login' ? (
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...loginForm.register('email')}
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          {...loginForm.register('password')}
                        />
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>

                    <Button
                      type="button"
                      variant="link"
                      className="w-full"
                      onClick={() => setCurrentView('reset')}
                    >
                      Forgot your password?
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-3">
                          {getUsernameIcon()}
                        </div>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          className="pl-10"
                          {...registerForm.register('username')}
                        />
                        {getUsernameBadge() && (
                          <div className="absolute right-3 top-2">
                            {getUsernameBadge()}
                          </div>
                        )}
                      </div>
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...registerForm.register('email')}
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a password"
                          className="pl-10"
                          {...registerForm.register('password')}
                        />
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          className="pl-10"
                          {...registerForm.register('confirmPassword')}
                        />
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || usernameStatus !== 'available'}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                )}

                <Separator />

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
                >
                  {mode === 'login' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reset"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-center">Reset Password</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Enter your email address and we'll send you a link to reset your password.
                  </AlertDescription>
                </Alert>

                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        {...resetForm.register('email')}
                      />
                    </div>
                    {resetForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {resetForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setCurrentView('auth')}
                  >
                    Back to Sign In
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
