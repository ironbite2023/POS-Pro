"use client";

import { Suspense, useState } from "react";
import { Box, Flex, Text, Button, Container, Card, Heading, IconButton, TextField } from "@radix-ui/themes";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAccentColor } from '@/contexts/AccentColorContext';

const LogoHeading = () => {
  const { theme } = useTheme();
  const { accentColor } = useAccentColor();

  return (
    <Box className="text-center" mb="6">
      <Flex direction="column" align="center" gap="4">
        <svg xmlns="http://www.w3.org/2000/svg" width="130" height="20" fill="none">
          <g clipPath="url(#a)">
            <path fill={`var(--${accentColor}-4)`} d="M15.146 3.074c.538 0 .973-.352.973-.79 0-.436-.435-.791-.973-.791s-.974.355-.974.79c0 .439.436.791.974.791Z"/>
            <mask id="b" width="30" height="4" x="0" y="13" maskUnits="userSpaceOnUse" style={{ maskType: 'luminance' }}>
              <path fill="#fff" d="M0 13.76h30v2.574H0V13.76Z"/>
            </mask>
            <g mask="url(#b)">
              <path fill={`var(--${accentColor}-4)`} d="M29.103 14.132H1.19a1.188 1.188 0 1 0 0 2.378h27.913a1.188 1.188 0 1 0 0-2.378Z"/>
            </g>
            <path fill={`var(--${accentColor}-9)`} d="M6.091 10.06c.286-1.409 1.17-2.95 2.555-3.545.256-.113.482.27.223.38-1.293.557-2.09 1.969-2.353 3.28-.056.28-.481.164-.425-.115Zm20.832 3.497c.007-.11.01-.219.01-.328 0-5.292-5.277-9.58-11.787-9.58-6.51 0-11.786 4.288-11.786 9.58 0 .11.003.219.006.328h23.557Z"/>
            <path fill={theme === 'dark' ? '#ffffff' : '#3F3F3F'} d="M38.343.881h10.425l-.397 1.81H43.32l-1.04 4.595h4.234l-.396 1.785h-4.234l-1.14 5.096h5.052L45.425 16H35L38.343.881Z"/>
            <path fill={theme === 'dark' ? '#ffffff' : '#3F3F3F'} d="M48.125 6.643c.842-.397 1.7-.683 2.575-.857.892-.19 1.882-.286 2.972-.286 1.056 0 1.931.08 2.624.238.694.159 1.247.389 1.66.69.412.302.701.66.866 1.072.165.413.248.881.248 1.405 0 .301-.025.627-.075.976-.032.35-.074.643-.123.88L57.708 16H53.72l-.445-1.524h-.15a5.507 5.507 0 0 1-1.856 1.286 5.423 5.423 0 0 1-2.08.428c-.396 0-.784-.055-1.164-.166a3.162 3.162 0 0 1-1.015-.5 2.725 2.725 0 0 1-.718-.881c-.182-.365-.273-.802-.273-1.31 0-.825.231-1.476.694-1.952.478-.492 1.097-.857 1.857-1.095.776-.254 1.642-.413 2.6-.476a44.909 44.909 0 0 1 2.922-.096c.033-.158.074-.38.123-.666a4.93 4.93 0 0 0 .075-.786 1.35 1.35 0 0 0-.248-.786c-.148-.254-.47-.38-.966-.38-.577 0-1.007.166-1.287.5a2.466 2.466 0 0 0-.52 1.166h-3.616l.471-2.12Zm5.695 4.19h-.446c-.478 0-.89.064-1.238.19-.33.112-.602.263-.817.453a1.9 1.9 0 0 0-.594 1.357c0 .381.099.667.297.857.215.191.462.286.743.286.347 0 .685-.119 1.015-.357.347-.238.562-.556.644-.952l.396-1.834ZM59.766 5.762c.611-.127 1.148-.27 1.61-.429a6.09 6.09 0 0 0 1.263-.595 5.727 5.727 0 0 0 1.114-.88c.363-.35.751-.779 1.164-1.287h2.55l-.718 3.19h1.932l-.322 1.596h-1.956L65.387 12c-.082.365-.148.69-.198.976-.05.286-.074.508-.074.667 0 .317.116.516.347.595.247.08.701.12 1.362.12L66.452 16a2.967 2.967 0 0 1-.545.071c-.23.016-.495.032-.792.048-.28.032-.578.048-.891.048-.298.015-.562.023-.793.023-.412 0-.817-.031-1.213-.095a3.18 3.18 0 0 1-1.065-.31 2.097 2.097 0 0 1-.767-.737c-.182-.318-.273-.746-.273-1.286 0-.19.008-.429.025-.714.033-.286.09-.604.173-.953l1.04-4.738H59.42l.346-1.595ZM72.138 16h-5.052l3.516-16h5.076l-3.54 16ZM79.813 5.762l.743 7 3.912-7h2.625L81.125 16c-.594 1-1.197 1.77-1.807 2.31-.611.54-1.28.936-2.006 1.19-.71.254-1.502.397-2.377.429-.859.047-1.84.071-2.947.071l.372-1.643c.544 0 1.048-.008 1.51-.024.479-.015.858-.063 1.14-.142.379-.096.651-.27.816-.524.165-.238.248-.596.248-1.072a7.02 7.02 0 0 0-.1-1.095 57.47 57.47 0 0 0-.172-1.31l-1.214-8.428h5.225ZM93.348 9.476c.495 0 .908-.198 1.238-.595.347-.397.627-.881.842-1.452a8.201 8.201 0 0 0 .495-1.786c.1-.62.149-1.159.149-1.62 0-.428-.075-.785-.223-1.07-.149-.302-.47-.453-.966-.453H93.77l-1.56 6.976h1.139ZM91.862 11l-1.114 5h-5.349L88.742.881h5.72c.941 0 1.8.048 2.575.143.776.095 1.445.286 2.006.571a3.12 3.12 0 0 1 1.312 1.238c.314.524.471 1.23.471 2.12a6.63 6.63 0 0 1-.421 2.357 4.783 4.783 0 0 1-1.312 1.928c-.595.54-1.37.968-2.328 1.286-.957.317-2.121.476-3.491.476h-1.412Z"/>
            <path fill={theme === 'dark' ? '#ffffff' : '#3F3F3F'} d="M109.433.643c1.42 0 2.567.174 3.442.524.892.349 1.593.889 2.105 1.619.33.492.586 1.047.768 1.666.181.62.272 1.334.272 2.143 0 .699-.066 1.397-.198 2.095a11.943 11.943 0 0 1-.569 2.024c-.232.635-.52 1.238-.867 1.81A8.054 8.054 0 0 1 113.272 14a6.476 6.476 0 0 1-2.699 1.714c-1.007.318-2.254.476-3.74.476-1.436 0-2.591-.142-3.466-.428-.875-.286-1.568-.746-2.08-1.381-.363-.444-.652-1.008-.867-1.69-.198-.683-.297-1.54-.297-2.572 0-1.762.322-3.333.966-4.714.66-1.397 1.593-2.5 2.798-3.31A7.944 7.944 0 0 1 106.313 1c.892-.238 1.932-.357 3.12-.357Zm-2.798 13.88c.38 0 .735-.158 1.065-.475.347-.334.66-.77.941-1.31.297-.556.561-1.182.792-1.88.248-.7.454-1.421.62-2.168.165-.746.288-1.484.371-2.214.099-.746.149-1.42.149-2.024 0-.825-.091-1.389-.273-1.69-.165-.318-.413-.476-.743-.476-.379 0-.743.158-1.089.476-.347.317-.677.746-.991 1.286a11.584 11.584 0 0 0-.817 1.833A26.91 26.91 0 0 0 106.041 8a26.06 26.06 0 0 0-.396 2.167 17.205 17.205 0 0 0-.124 1.976c0 .905.099 1.532.297 1.88.215.334.487.5.817.5ZM124.973 5.262a4.98 4.98 0 0 0 .075-.976c0-.238-.017-.469-.05-.69a2.148 2.148 0 0 0-.173-.62.886.886 0 0 0-.372-.428c-.165-.111-.379-.167-.643-.167-.298 0-.57.063-.818.19-.247.127-.47.294-.668.5-.182.19-.33.421-.446.69a2.209 2.209 0 0 0-.148.81c0 .413.107.73.321.953a2.7 2.7 0 0 0 .892.547c.363.143.776.262 1.238.358.462.095.941.206 1.436.333.413.111.826.254 1.238.428.413.175.776.413 1.09.715.33.285.594.666.792 1.143.198.46.297 1.04.297 1.738 0 1-.206 1.841-.619 2.524a4.807 4.807 0 0 1-1.708 1.666c-.727.429-1.593.738-2.6.929-.991.19-2.072.286-3.244.286-1.189 0-2.163-.072-2.922-.215-.743-.159-1.329-.325-1.758-.5-.512-.206-.892-.444-1.139-.714l.842-3.262h4.358c-.017.143-.033.341-.05.595a8.954 8.954 0 0 0-.024.572c0 .19.024.389.074.595.049.206.124.397.223.571.115.175.272.318.47.429.198.111.446.167.743.167.33 0 .619-.072.867-.215.264-.143.478-.317.643-.524.182-.222.314-.46.397-.714.099-.27.148-.532.148-.786 0-.349-.091-.642-.272-.88a1.927 1.927 0 0 0-.693-.596 4.4 4.4 0 0 0-1.04-.428 51.3 51.3 0 0 0-1.189-.381 19.468 19.468 0 0 1-1.263-.405 4.372 4.372 0 0 1-1.189-.667 3.707 3.707 0 0 1-.916-1.071c-.231-.445-.346-1.008-.346-1.69 0-1.016.264-1.866.792-2.548a6.256 6.256 0 0 1 2.031-1.69 9.425 9.425 0 0 1 2.699-.905c.974-.19 1.898-.286 2.773-.286 1.155 0 2.146.135 2.971.405.842.254 1.478.555 1.907.904l-.916 3.31h-4.111Z"/>
          </g>
          <defs>
            <clipPath id="a">
              <path fill="#fff" d="M0 0h130v20H0z"/>
            </clipPath>
          </defs>
        </svg>
      </Flex>
    </Box>
  );
};

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // This would be where you'd call your API to reset the password
      // For example: await resetPassword(token, password);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setIsLoading(false);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      setError(`Failed to reset password. Please try again. ${err}`);
      setIsLoading(false);
    }
  };
  
  if (!token) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Box className="w-full max-w-md p-8 mx-auto">
          <LogoHeading />
          
          <Card size="3">
            <Flex direction="column" align="center" gap="4" p="4">
              <Heading size="5">Invalid Reset Link</Heading>
              <Text as="p" size="2" align="center">
                This password reset link is invalid or has expired. Please request a new one.
              </Text>
              <Button 
                onClick={() => router.push("/auth/forgot-password")}
                className="!w-full"
                color="gray"
              >
                Back to Forgot Password
              </Button>
            </Flex>
          </Card>
        </Box>
      </Flex>
    );
  }
  
  if (success) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Box className="w-full max-w-md p-8 mx-auto">
          <LogoHeading />
          
          <Flex direction="column" align="center" gap="4" p="4">
            <Check size={48} className="text-green-500" />
            <Heading size="5">Password Reset Successful!</Heading>
            <Text size="2" align="center">
              Your password has been successfully reset. You will be redirected to the login page in a few seconds.
            </Text>
          </Flex>
        </Box>
      </Flex>
    );
  }
  
  return (
    <Flex align="center" justify="center" className="min-h-screen">
      <Container size="2" className="max-w-md w-full mx-auto px-4">
        <LogoHeading />
        
        <Card size="3">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Flex align="center" gap="2" className="p-3 mb-4 bg-red-50 border border-red-200 rounded dark:bg-red-900/20 dark:border-red-900/50">
                <AlertCircle size={16} className="text-red-500" />
                <Text size="2" className="text-red-600 dark:text-red-400">{error}</Text>
              </Flex>
            )}
            
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium" htmlFor="password">
                New Password
              </Text>
              <TextField.Root
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
                required
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
            
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium" htmlFor="confirmPassword">
                Confirm Password
              </Text>
              <TextField.Root
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
                required
              >
                <TextField.Slot>
                  <Lock size={16} />
                </TextField.Slot>
                <TextField.Slot>
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="gray"
                    onClick={toggleConfirmPasswordVisibility}
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
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </Box>
          </form>
        </Card>
        
        <Box className="text-center mt-4">
          <Text as="span" size="1" color="gray">
            <Link href="/auth/login">
              Back to Login
            </Link>
          </Text>
        </Box>
      </Container>
    </Flex>
  );
}

export default function ResetPassword() {
  usePageTitle('Reset Password');
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}