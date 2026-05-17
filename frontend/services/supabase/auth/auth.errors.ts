export function parseAuthError(error: unknown): string{
    if(!error) return 'Error desconocido'
    const msg = (error as Error).message ?? String(error)

    if(msg.includes('User already registered'))
        return 'Ya existe una cuenta con ese email'
    if(msg.includes('Invalid login credentials'))
        return 'Email o contraseña incorretos.'
    if(msg.includes('Email not confirmed'))
        return 'Confirma tu email antes de iniciar sesion.'
    if(msg.includes('Password should be at least'))
        return 'La contraseña debe tener al menos 8 caracteres.'
    if(msg.includes('Unable to validate email address'))
        return 'El email no tiene un formato valido.'
    if(msg.includes('duplicate key') && msg.includes('username'))
        return 'Ese nombre de usuario ya esta en uso.'

    return msg
}