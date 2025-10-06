'use client';

import { useState, useMemo } from 'react';
import { Box, Container, Flex, Heading, Text, Button, Link, Card, IconButton, TextField } from '@radix-ui/themes';
import { Eye, EyeOff, Lock, Mail, User, Building2, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { validatePasswordStrength } from '@/lib/utils/validation';

export default function SignupPage() {
  usePageTitle('Sign Up');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!formData.password) return null;
    return validatePasswordStrength(formData.password);
  }, [formData.password]);

  // Password strength color
  const getPasswordStrengthColor = (score: number): string => {
    if (score === 0) return 'red';
    if (score <= 2) return 'orange';
    if (score === 3) return 'yellow';
    return 'green';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the production-ready signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          organizationName: formData.organizationName,
          phone: formData.phone || undefined,
        }),
      });

      const data = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        toast.error(data.message || 'Too many signup attempts. Please try again later.');
        return;
      }

      // Handle validation errors
      if (!response.ok) {
        // Show specific field errors
        if (data.requirements) {
          data.requirements.forEach((req: string) => toast.error(req));
        } else {
          toast.error(data.message || 'Signup failed. Please try again.');
        }
        return;
      }

      // Success
      toast.success(data.message || 'Account created successfully!');
      
      // Redirect to login page after delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex className="min-h-screen">
      {/* Left side - Full height image or gradient */}
      <div className="hidden lg:block w-1/2 relative">
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
            <Text size="5" className="text-white/90">Start managing your restaurant today</Text>
          </div>
        </div>
      </div>

      {/* Right side - Signup form */}
      <Flex 
        direction="column"
        justify="center"
        className="w-full lg:w-1/2 px-4 sm:px-6 lg:px-8 py-12"
      >
        <Box className="text-center" mb="6">
          <Flex direction="column" align="center" gap="4">
            <Image 
              src={theme === 'dark' ? '/images/logo-dark.png' : '/images/logo.png'} 
              alt="EatlyPOS Logo" 
              width={130} 
              height={20}
            />
            <Heading size="5">Create your account</Heading>
          </Flex>
        </Box>

        <Container size="3" className="max-w-2xl w-full mx-auto">
          <Card size="3">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Name */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Organization Name *</Text>
                <TextField.Root 
                  type="text"
                  placeholder="Your Restaurant Name" 
                  value={formData.organizationName}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                  required
                  className="w-full"
                >
                  <TextField.Slot>
                    <Building2 size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              {/* Name Fields */}
              <Flex gap="3" direction={{ initial: 'column', sm: 'row' }}>
                <Flex direction="column" gap="1" className="flex-1">
                  <Text as="label" size="2" weight="medium">First Name *</Text>
                  <TextField.Root 
                    type="text"
                    placeholder="John" 
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    className="w-full"
                  >
                    <TextField.Slot>
                      <User size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                </Flex>

                <Flex direction="column" gap="1" className="flex-1">
                  <Text as="label" size="2" weight="medium">Last Name *</Text>
                  <TextField.Root 
                    type="text"
                    placeholder="Doe" 
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    className="w-full"
                  >
                    <TextField.Slot>
                      <User size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                </Flex>
              </Flex>

              {/* Email */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Email Address *</Text>
                <TextField.Root 
                  type="email"
                  placeholder="your@email.com" 
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="w-full"
                >
                  <TextField.Slot>
                    <Mail size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              {/* Phone */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Phone Number</Text>
                <TextField.Root 
                  type="tel"
                  placeholder="+1 (555) 123-4567" 
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full"
                >
                  <TextField.Slot>
                    <Phone size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              {/* Password */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Password *</Text>
                <TextField.Root
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
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
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-0 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </TextField.Slot>
                </TextField.Root>
                
                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <Box className="mt-2">
                    <Flex justify="between" align="center" className="mb-1">
                      <Text size="1" color="gray">Password Strength:</Text>
                      <Text size="1" weight="medium" style={{ color: `var(--${getPasswordStrengthColor(passwordStrength.score)}-9)` }}>
                        {passwordStrength.score === 0 && 'Very Weak'}
                        {passwordStrength.score === 1 && 'Weak'}
                        {passwordStrength.score === 2 && 'Fair'}
                        {passwordStrength.score === 3 && 'Good'}
                        {passwordStrength.score === 4 && 'Strong'}
                      </Text>
                    </Flex>
                    <Box className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <Box 
                        className="h-full transition-all duration-300"
                        style={{ 
                          width: `${(passwordStrength.score / 4) * 100}%`,
                          backgroundColor: `var(--${getPasswordStrengthColor(passwordStrength.score)}-9)`
                        }}
                      />
                    </Box>
                    {passwordStrength.feedback.length > 0 && (
                      <Flex direction="column" gap="1" className="mt-2">
                        {passwordStrength.feedback.map((feedback, index) => (
                          <Flex key={index} align="center" gap="1">
                            <AlertCircle size={12} color="var(--orange-9)" />
                            <Text size="1" color="orange">{feedback}</Text>
                          </Flex>
                        ))}
                      </Flex>
                    )}
                    {passwordStrength.isValid && (
                      <Flex align="center" gap="1" className="mt-1">
                        <CheckCircle size={12} color="var(--green-9)" />
                        <Text size="1" color="green">Password meets all requirements</Text>
                      </Flex>
                    )}
                  </Box>
                )}
                {!formData.password && (
                  <Text size="1" color="gray">Must be at least 8 characters with uppercase, lowercase, number, and special character</Text>
                )}
              </Flex>

              {/* Confirm Password */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Confirm Password *</Text>
                <TextField.Root
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
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
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="p-0 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </Box>
            </form>
          </Card>
          
          <Box className="text-center mt-4">
            <Text size="2" color="gray">
              Already have an account?{' '}
              <Link href="/auth/login" size="2" weight="medium">
                Sign in
              </Link>
            </Text>
          </Box>
        </Container>
        
        <Box className="text-center mt-8">
          <Text as="p" size="1" color="gray">
            © {new Date().getFullYear()} EatlyPOS. All rights reserved.
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}
