import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import {
  isValidEmail,
  validatePasswordStrength,
  sanitizeInput,
  sanitizeOrganizationName,
  generateSlug,
  isValidPhone,
  isValidName,
} from '@/lib/utils/validation';
import {
  checkRateLimit,
  getClientIp,
  createRateLimitHeaders,
} from '@/lib/utils/rate-limit';

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Production-ready signup endpoint with comprehensive security measures
 * 
 * Features:
 * - Input validation and sanitization
 * - Rate limiting (5 attempts per 15 minutes per IP)
 * - Strong password requirements
 * - Email verification flow (auto-confirm in development)
 * - Duplicate checks
 * - Atomic transactions with rollback
 * - Audit logging
 * - Proper error handling
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  let organizationId: string | undefined;

  try {
    // ============================================
    // STEP 1: Rate Limiting
    // ============================================
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(`signup:${clientIp}`, 5, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      return NextResponse.json(
        {
          error: 'Too many signup attempts',
          message: `Please try again after ${resetDate.toLocaleTimeString()}`,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // ============================================
    // STEP 2: Parse and Validate Input
    // ============================================
    const body = await request.json();
    const { email, password, firstName, lastName, organizationName, phone } = body;

    // Required fields validation
    if (!email || !password || !firstName || !lastName || !organizationName) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Missing required fields',
          fields: {
            email: !email ? 'Email is required' : undefined,
            password: !password ? 'Password is required' : undefined,
            firstName: !firstName ? 'First name is required' : undefined,
            lastName: !lastName ? 'Last name is required' : undefined,
            organizationName: !organizationName ? 'Organization name is required' : undefined,
          },
        },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Email validation
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid email format',
          field: 'email',
        },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Password strength validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Password does not meet requirements',
          field: 'password',
          requirements: passwordValidation.feedback,
        },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Name validation
    if (!isValidName(firstName)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid first name format',
          field: 'firstName',
        },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    if (!isValidName(lastName)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid last name format',
          field: 'lastName',
        },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Phone validation (optional)
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid phone number format',
          field: 'phone',
        },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);
    const sanitizedOrgName = sanitizeOrganizationName(organizationName);
    const sanitizedPhone = phone ? sanitizeInput(phone) : null;

    // ============================================
    // STEP 3: Check for Duplicates
    // ============================================
    
    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users.some((u: { email: string }) => u.email === sanitizedEmail);

    if (emailExists) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'An account with this email already exists',
          field: 'email',
        },
        {
          status: 409,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Generate and check organization slug
    const organizationSlug = generateSlug(sanitizedOrgName);
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', organizationSlug)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'An organization with this name already exists. Please choose a different name.',
          field: 'organizationName',
        },
        {
          status: 409,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // ============================================
    // STEP 4: Create Auth User with Email Verification
    // ============================================
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password: password,
      email_confirm: isDevelopment, // Auto-confirm in development, require verification in production
      user_metadata: {
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
      },
    });

    if (authError) {
      console.error('[Signup] Auth creation error:', authError);
      return NextResponse.json(
        {
          error: 'Signup Failed',
          message: authError.message || 'Failed to create user account',
        },
        {
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          error: 'Signup Failed',
          message: 'User creation failed',
        },
        {
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    userId = authData.user.id;

    // ============================================
    // STEP 5: Create Organization
    // ============================================
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: sanitizedOrgName,
        slug: organizationSlug,
        settings: {
          timezone: 'UTC',
          currency: 'USD',
          date_format: 'MM/DD/YYYY',
        },
      })
      .select()
      .single();

    if (orgError || !organization) {
      console.error('[Signup] Organization creation error:', orgError);
      // Rollback: Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          error: 'Signup Failed',
          message: orgError?.message || 'Failed to create organization',
        },
        {
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    organizationId = organization.id;

    // ============================================
    // STEP 6: Initialize Organization
    // ============================================
    try {
      await supabaseAdmin.rpc('initialize_organization', {
        org_id: organization.id,
        org_name: organization.name,
      });
    } catch (error) {
      console.error('[Signup] Failed to initialize organization:', error);
      // Rollback: Delete organization and auth user
      await supabaseAdmin.from('organizations').delete().eq('id', organizationId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          error: 'Signup Failed',
          message: 'Failed to initialize organization',
        },
        {
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // ============================================
    // STEP 7: Get Admin Role
    // ============================================
    const { data: adminRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('name', 'Admin')
      .single();

    // ============================================
    // STEP 8: Create User Profile
    // ============================================
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: sanitizedEmail,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        organization_id: organization.id,
        role_id: adminRole?.id || null,
        phone: sanitizedPhone,
        status: 'active',
      })
      .select()
      .single();

    if (profileError) {
      console.error('[Signup] Profile creation error:', profileError);
      // Rollback: Delete organization and auth user
      await supabaseAdmin.from('organizations').delete().eq('id', organizationId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          error: 'Signup Failed',
          message: profileError.message || 'Failed to create user profile',
        },
        {
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // ============================================
    // STEP 9: Audit Logging
    // ============================================
    const duration = Date.now() - startTime;
    console.log('[Signup] Success', {
      userId: userId,
      email: sanitizedEmail,
      organizationId: organization.id,
      organizationName: sanitizedOrgName,
      ip: clientIp,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // ============================================
    // STEP 10: Success Response
    // ============================================
    const successMessage = isDevelopment
      ? 'Account created successfully! You can now log in.'
      : 'Account created successfully! Please check your email to verify your account.';
    
    const nextStep = isDevelopment ? 'login' : 'verify_email';

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        user: {
          id: userId,
          email: sanitizedEmail,
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
        },
        organization: {
          id: organization.id,
          name: sanitizedOrgName,
          slug: organizationSlug,
        },
        nextStep: nextStep,
      },
      {
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error: any) {
    // ============================================
    // Error Handling and Logging
    // ============================================
    const duration = Date.now() - startTime;
    console.error('[Signup] Unexpected error:', {
      error: error.message,
      stack: error.stack,
      userId,
      organizationId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // Attempt cleanup if we have IDs
    if (userId || organizationId) {
      try {
        if (organizationId) {
          await supabaseAdmin.from('organizations').delete().eq('id', organizationId);
        }
        if (userId) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        }
      } catch (cleanupError) {
        console.error('[Signup] Cleanup failed:', cleanupError);
      }
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again later.',
      },
      {
        status: 500,
      }
    );
  }
}
