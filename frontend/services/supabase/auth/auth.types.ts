export interface AuthUser {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  email_confirmed_at: string;
  profile_pic: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  full_name: string;
  username: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult<T = null> {
  data: T | null;
  error: string | null;
}

export interface EmailVerificationRetryResult {
  emailVerificationSent: boolean;
  timestamp: string;
}

export interface RetryCheckResult {
  can_retry: boolean;
  retry_after_seconds: number;
  attempts_used: number;
}

export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LEN = 8;
export const MAX_FULL_NAME_LEN = 120;
export const TRIGGER_WAIT_MS = 1000;
export const TRIGGER_RETRIES = 3;
