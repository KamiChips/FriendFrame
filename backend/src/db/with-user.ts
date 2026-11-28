// PROVISIONAL
// solo use esto para completar mi otra tarea :p

export interface Queryable {
    query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[]}>;
}

export async function withUser<T>(
    userId: string,
    fn: (tx: Queryable) => Promise<T>
): Promise<T> {
    // TODO: reemplazar esto por la implementacion real
    throw new Error("withUser no esta implementado");
}