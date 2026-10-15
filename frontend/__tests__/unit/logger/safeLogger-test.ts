//import * as Sentry from "@sentry/react-native";
import { safeLogger } from '@/lib/logger/safeLogger';

jest.mock('@sentry/react-native', () => ({
    captureException: jest.fn(),
}));

describe('safeLogger', () => {
    const originalDev = (globalThis as any).__DEV__;

    let consoleDebugSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        //(Sentry.captureException as jest.Mock).mockClear();
        consoleDebugSpy = jest
            .spyOn(console, 'debug')
            .mockImplementation(() => {});
        consoleInfoSpy = jest
            .spyOn(console, 'info')
            .mockImplementation(() => {});
        consoleWarnSpy = jest
            .spyOn(console, 'warn')
            .mockImplementation(() => {});
        consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        (globalThis as any).__DEV__ = originalDev;
    });

    function setEnv(env: string) {
        (globalThis as any).__DEV__ = env === 'development';
    }

    describe('comportamiento por entorno', () => {
        it('no debe loguear debug/info en production', () => {
            setEnv('production');

            safeLogger.debug('mensaje debug');
            safeLogger.info('mensaje info');

            expect(consoleDebugSpy).not.toHaveBeenCalled();
            expect(consoleInfoSpy).not.toHaveBeenCalled();
        });

        it('debe loguear debug/info en development', () => {
            setEnv('development');

            safeLogger.debug('mensaje debug');
            safeLogger.info('mensaje info');

            expect(consoleDebugSpy).toHaveBeenCalled();
            expect(consoleInfoSpy).toHaveBeenCalled();
        });

        it('debe loguear warn/error en cualquier entorno', () => {
            setEnv('production');

            safeLogger.warn('mensaje warn');
            safeLogger.error('mensaje error');

            expect(consoleWarnSpy).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('filtrado de datos sensibles', () => {
        beforeEach(() => setEnv('development'));

        it('debe filtrar tokens', () => {
            safeLogger.debug('test', { token: 'abc123secret' });

            const loggedArg = consoleDebugSpy.mock.calls[0][1];
            expect(JSON.stringify(loggedArg)).not.toContain('abc123secret');
            expect(loggedArg.token).toBe('[REDACTED]');
        });

        it('debe filtrar variantes anidadas (accessToken, refreshToken)', () => {
            safeLogger.debug('test', {
                session: {
                    accessToken: 'at-secret',
                    refreshToken: 'rt-secret',
                },
            });

            const loggedArg = consoleDebugSpy.mock.calls[0][1];
            expect(loggedArg.session.accessToken).toBe('[REDACTED]');
            expect(loggedArg.session.refreshToken).toBe('[REDACTED]');
        });

        it('debe filtrar emails', () => {
            safeLogger.debug('test', { email: 'user@example.com' });

            const loggedArg = consoleDebugSpy.mock.calls[0][1];
            expect(JSON.stringify(loggedArg)).not.toContain('user@example.com');
            expect(loggedArg.email).toBe('[REDACTED]');
        });

        it('debe filtrar password y user_id', () => {
            safeLogger.debug('test', {
                password: 'hunter5',
                user_id: 'u_12345',
            });

            const loggedArg = consoleDebugSpy.mock.calls[0][1];
            expect(loggedArg.password).toBe('[REDACTED]');
            expect(loggedArg.user_id).toBe('[REDACTED]');
        });

        it('no debe filtrar campos no sensibles', () => {
            safeLogger.debug('test', { full_name: 'May Dev', username: 'may' });

            const loggedArg = consoleDebugSpy.mock.calls[0][1];
            expect(loggedArg.full_name).toBe('May Dev');
            expect(loggedArg.username).toBe('may');
        });
    });

    describe('truncado de objetos grandes', () => {
        beforeEach(() => setEnv('development'));

        it('debe truncar strings mayores a 1000 caracteres', () => {
            const largeString = 'a'.repeat(1500);
            safeLogger.debug('test', largeString);

            const loggedArg = consoleDebugSpy.mock.calls[0][1];
            expect(loggedArg.length).toBeLessThan(1500);
            expect(loggedArg).toContain('truncated');
        });

        it('debe truncar objetos serializados grandes', () => {
            const largeObject = { data: 'x'.repeat(2000) };
            safeLogger.debug('test', largeObject);

            const loggedArg = consoleDebugSpy.mock.calls[0][1];
            expect(typeof loggedArg).toBe('string');
            expect(loggedArg).toContain('truncated');
        });
    });

    /*
    describe("integración con Sentry (React Native)", () => {
        beforeEach(() => setEnv("production"));

        it("debe enviar errores críticos a Sentry.captureException", () => {
        const error = new Error("Fallo crítico en auth");
        safeLogger.error("Error en signUp", error);

        expect(Sentry.captureException).toHaveBeenCalledTimes(1);
        expect(Sentry.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({
            extra: expect.objectContaining({ message: "Error en signUp" }),
            })
        );
        });

        it("debe envolver strings/objetos no-Error en un Error antes de enviarlos", () => {
        safeLogger.error("Fallo sin objeto Error", { code: "AUTH_FAILED" });

        expect(Sentry.captureException).toHaveBeenCalledTimes(1);
        const [sentArg] = (Sentry.captureException as jest.Mock).mock.calls[0];
        expect(sentArg).toBeInstanceOf(Error);
        expect(sentArg.message).toBe("Fallo sin objeto Error");
        });

        it("no debe romper el logging si Sentry.captureException falla", () => {
        (Sentry.captureException as jest.Mock).mockImplementationOnce(() => {
            throw new Error("Sentry down");
        });

        expect(() => safeLogger.error("test", new Error("original"))).not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalled();
        });
    });*/

    describe('manejo de errores especiales', () => {
        it('debe serializar Error a {name, message, stack} y ocultar stack en producción', () => {
            setEnv('production');
            const err = new Error('boom');
            safeLogger.error('fallo', err);

            const loggedArg = consoleErrorSpy.mock.calls[0][1];
            expect(loggedArg.name).toBe('Error');
            expect(loggedArg.message).toBe('boom');
            expect(loggedArg.stack).toBeUndefined();
        });

        it('debe manejar referencias circulares sin crashear', () => {
            setEnv('development');
            const circular: any = { name: 'test' };
            circular.self = circular;

            expect(() => safeLogger.debug('circular', circular)).not.toThrow();
        });
    });
});
