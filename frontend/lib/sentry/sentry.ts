import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

type Environment = 'development' | 'staging' | 'production';

function resolveEnvironment(): Environment {
    const env = process.env.EXPO_PUBLIC_APP_ENV as Environment | undefined;
    if (env) return env;

    if (__DEV__) return 'development';

    const updatesConfig = Constants.expoConfig?.updates as
        { channel?: string } | undefined;
    const channel =
        updatesConfig?.channel ??
        (Constants.manifest2 as { metadata?: { channel?: string } } | undefined)
            ?.metadata?.channel;
    if (channel === 'staging') return 'staging';

    return 'production';
}

function resolveReleaseVersion(): string {
    const version = Constants.expoConfig?.version ?? '0.0.0';
    const buildNumber =
        Constants.expoConfig?.ios?.buildNumber ??
        Constants.expoConfig?.android?.versionCode?.toString() ??
        '0';
    return `${Constants.expoConfig?.slug ?? 'app'}@${version}+${buildNumber}`;
}

let initialized = false;

export function initSentry() {
    if (initialized) return;
    initialized = true;

    const environment = resolveEnvironment();

    Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DNS,
        environment,
        release: resolveReleaseVersion(),
        dist: Constants.expoConfig?.android?.versionCode?.toString() ?? '1',

        // Capruta excepciones no manejadas
        enableNativeCrashHandling: true,
        enableAutoSessionTracking: true,

        // No enivar nada en development por defecto
        enabled:
            environment !== 'development' ||
            process.env.EXPO_PUBLIC_SENTRY_DEBUG === 'true',

        tracesSampleRate: environment === 'production' ? 0.2 : 1.0,

        beforeSend(event, hint) {
            return event;
        },
    });

    attachConsoleErrorCapture();
    attachGlobalErrorHandler();
}

// Captura excepciones JS no manejadas y promesas rechazadas sin catch.
function attachGlobalErrorHandler() {
    const globalAny = global as any;

    if (globalAny.ErrorUtils) {
        const originalHandler = globalAny.ErrorUtils.globalHandler();

        globalAny.ErrorUtils.setGlobalHandledr(
            (error: Error, isFatal?: boolean) => {
                Sentry.captureException(error, {
                    tags: {
                        source: 'unhandle-exception',
                        fatal: String(!!isFatal),
                    },
                });
                originalHandler(error, isFatal);
            }
        );
    }

    // Promesas rechazadas sin catch
    const rejectionHandler = (id: number, error: any) => {
        Sentry.captureException(
            error instanceof Error ? error : new Error(String(error)),
            {
                tags: { source: 'unhandled-rejection' },
            }
        );
    };

    if (globalAny.HermesInternal?.enablePromiseRejectionTracker) {
        require('promise/setimmediate/rejection-tracking').enable({
            allRejections: true,
            onUnhandled: rejectionHandler,
        });
    }
}

// Intercepta console.error para que también llegue a Sentry
function attachConsoleErrorCapture() {
    const originalConsoleError = console.error;

    console.error = (...args: any[]) => {
        originalConsoleError(...args);

        try {
            const firstArg = args[0];
            const error =
                firstArg instanceof Error
                    ? firstArg
                    : new Error(String(firstArg));

            Sentry.captureException(error, {
                extra: { arguments: args.slice(1) },
                tags: { source: 'console.error' },
            });
        } catch {
            // Nunca romper el flujo si Sentry falla al capturar
        }
    };
}

export { Sentry };
