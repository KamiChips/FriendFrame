//import * as Sentry from "@sentry/react-native";

type LogData = Record<string, any> | any[] | any;

 interface SafeLogger {
    debug(msg: string, data?: any): void
    info(msg: string, data?: any): void
    warn(msg: string, data?: any): void
    error(msg: string, error?: any): void
}

// Lista de palabras clave sensibles que deben ser ocultadas en los logs
const SENSITIVE_KEYS = [
    "token",
    "password",
    "email",
    "user_id",
].map((k) => k.toLowerCase());

const StringLengthLimit = 1000; // Limite para strings
const isDev = () => __DEV__; // Determina si el entorno es de desarrollo

// Sanitiza los datos para evitar exponer información sensible o demasiado larga en los logs
function sanitizeData(value: any,seen = new WeakSet<object>()): LogData {
    if (value === null || value === undefined) {
        return value;
    }

    // Cortar strings si son muy largos
    if (typeof value === "string") {
        return value.length > StringLengthLimit 
        ? `${value.slice(0, StringLengthLimit)}... [truncated ${value.length - StringLengthLimit} chars]`
        : value
    }

    // Evitar procesar datos que no se permiten en los logs
    if (typeof value !== "object") return value;

    // Evitar referencias circulares
    if (seen.has(value)) return "[Circular Reference]";
    seen.add(value);

    // Manejar errores
    if (value instanceof Error) {
        return {
            name: value.name,
            message: sanitizeData(value.message, seen),
            stack: isDev() ? value.stack : undefined,
        };
    }

    // Manejar arrays
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeData(item, seen));
    }

    // Manejar objetos
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = [...SENSITIVE_KEYS].some((f) => lowerKey.includes(f.toLowerCase())); // Verifica si la clave contiene alguna palabra sensible

        if (isSensitive) {
            sanitized[key] = "[REDACTED]";
            continue;
        }

        sanitized[key] = sanitizeData(val, seen);
    }

    // Cortar objetos grandes
    const serialized = JSON.stringify(sanitized);
    if(serialized && serialized.length > StringLengthLimit) {
        return `$[Object truncated, ${serialized.length} chars] ${serialized.slice(0, StringLengthLimit)}...`; // Corta el objeto si es demasiado grande
    }

    return sanitized;
}

// Formatea el mensaje de log con un timestamp y el nivel de log
function formatLogMessage(level: string, msg: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${msg}`;
}

// Implementación del logger seguro
export const safeLogger: SafeLogger = {
    debug(msg, data) { // log tipo debug solo en desarrollo
        if(!isDev()) return;
        console.debug(formatLogMessage("debug", msg), data != undefined ? sanitizeData(data) : "");
    },
    info(msg, data) { // Log para información general 
        if(!isDev()) return;
        console.info(formatLogMessage("info", msg), data != undefined ? sanitizeData(data) : "");
    },
    warn(msg, data) { // Log para advertencias
        console.warn(formatLogMessage("warn", msg), data != undefined ? sanitizeData(data) : "");
    },
    error(msg, error) { // Log para errores
        //const sanitized = error !== undefined ? sanitizeData(error) : "";
        console.error(formatLogMessage("error", msg), error != undefined ? sanitizeData(error) : "");

        /*
        try {
            Sentry.captureException(error instanceof Error ? error : new Error(msg), {
                extra: { message: msg, data: sanitized },
            });
        } catch (sentryError) {
            console.warn(formatLogMessage("warn", "Sentry captureException failed"), sentryError);
        }*/
    },
}

export default safeLogger;