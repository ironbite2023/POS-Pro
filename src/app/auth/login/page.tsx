'use client';

import { useState, useEffect, Suspense } from 'react';
import { Box, Container, Flex, Heading, Text, Button, Link, Card, IconButton, TextField } from '@radix-ui/themes';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle redirect messages and returnTo parameter
  useEffect(() => {
    const message = searchParams.get('message');
    
    if (message) {
      toast.info(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      toast.success('Login successful!');
      
      // Redirect to returnTo URL if available, otherwise go to dashboard
      const returnTo = searchParams.get('returnTo');
      const redirectUrl = returnTo || '/';
      router.push(redirectUrl);
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Flex className="h-screen">
      {/* Left side - Full height image or gradient */}
      <div className="hidden md:block w-1/2 relative">
        <Image
          src="/images/restaurant-counter.png"
          alt="Restaurant counter"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="p-8 text-white text-center">
            <Heading size="8" className="mb-4 text-white">EatlyPOS</Heading>
            <Text size="5" className="text-white/90">Managing your restaurant made easy</Text>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <Flex 
        direction="column"
        justify="end"
        className="w-full md:w-1/2 px-4 sm:px-6 lg:px-8 py-12"
      >
        <Box className="flex-grow"></Box>
        
        <Box className="text-center" mb="6">
          <Flex direction="column" align="center" gap="4">
            <Image 
              src={theme === 'dark' ? '/images/logo-dark.png' : '/images/logo.png'} 
              alt="EatlyPOS Logo" 
              width={130} 
              height={20}
            />
            <Heading size="5">Login to your account</Heading>
          </Flex>
        </Box>

        <Container size="2" className="max-w-md w-full mx-auto">
          <Card size="3">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Email Address</Text>
                <TextField.Root 
                  type="email"
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                >
                  <TextField.Slot>
                    <Mail size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Password</Text>
                <TextField.Root
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                >
                  <TextField.Slot>
                    <Lock size={16} />
                  </TextField.Slot>
                  <TextField.Slot>
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      onClick={togglePasswordVisibility}
                      className="p-0 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <Box>
                <Button 
                  type="submit"
                  className="!w-full"
                  disabled={isLoading}
                  size="3"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </Box>
            </form>
          </Card>
          <Flex direction="column" gap="2" className="text-center mt-4">
            <Link href="/auth/forgot-password" size="2" color="gray">
              Forgot password?
            </Link>
            <Box>
              <Text size="2" color="gray">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" size="2" weight="medium">
                  Sign up
                </Link>
              </Text>
            </Box>
          </Flex>
        </Container>
        
        <Box className="text-center mt-8 mb-4">
          <Text as="p" size="1" color="gray">
            © {new Date().getFullYear()} EatlyPOS. All rights reserved.
          </Text>
          <Text as="p" size="1" color="gray">
            Version 1.0.0 (Build 001)
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}

export default function LoginPage() {
  usePageTitle('Login');
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 