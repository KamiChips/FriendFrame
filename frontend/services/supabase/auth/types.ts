export interface AuthUser{
    user_id: string
    full_name: string
    username: string
    email: string
    profile_pic: string | null
    created_at: string
    updated_at: string
}

export interface SignUpParams{
    email: string
    password: string
    full_name: string
    username: string
}

export interface SignInParams{
    email: string
    password: string
}

export interface AuthResult<T = null>{
    data: T | null
    error: string | null
}