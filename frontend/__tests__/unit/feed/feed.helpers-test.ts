import {
    parseError,
    mapRow
} from "@/services/supabase/feed/feed.helpers";

// parseError
describe("parseError", () => {
    it("devuelve error desconocido si no  hay error", () => {
        expect(parseError(null)).toBe("Error desconocido");
    });

    it("mapea Failed to fetch al mensaje correcto", () => {
        expect(parseError(new Error("NetworkError occured"))).toBe(
            "Error de red. Verifica tu conexión.",
        );
    });

    it("mapea Failed to fetch al mensaje correcto", () => {
        expect(parseError(new Error("Failed to fetch"))).toBe(
            "Error de red. Verifica tu conexión.",
        );
    });

    it("devuelve mensaje para errores desconocidos", () => {
        expect(parseError(new Error("algún error raro"))).toBe(
            "No se pudo cargar el feed.",
        );
    });

    it("devuelve error desconocido si se pasa undefined", () => {
        expect(parseError(undefined)).toBe("Error desconocido");
    });
});

// mapRow
describe("mapRow", () => {
    const baseRow = {
        id: "post-1",
        pub_type: "post",
        author_id: "550e8400-e29b-41d4-a716-446655440000",
        account_owner_id: "6ba7b810-9dad-41d4-80b4-00c04fd430c8",
        media: "https://example.com/image.jpg",
        media_type: "image",
        description: "Una descripción",
        content: "Contenido del post",
        created_at: "2024-01-01T00:00:00Z",
        author_username: "maydev",
        author_full_name: "May",
        author_pic: "https://example.com/pic.jpg",
        owner_username: "owneruser",
        owner_full_name: "Owner",
        owner_pic: "https://example.com/owner.jpg",
        likes_count: "5",
        comments_count: "3",
        shares_count: "1",
        liked_by_me: true,
    };

    it("mapea todos los campos correctamente", () => {
        const result = mapRow(baseRow);

        expect(result.id).toBe("post-1");
        expect(result.type).toBe("post");
        expect(result.author_id).toBe(baseRow.author_id);
        expect(result.account_owner_id).toBe(baseRow.account_owner_id);
        expect(result.media).toBe("https://example.com/image.jpg");
        expect(result.media_type).toBe("image");
        expect(result.description).toBe("Una descripción"),
        expect(result.content).toBe("Contenido del post"),
        expect(result.created_at).toBe("2024-01-01T00:00:00Z");
    });

    it("mapea el author correctamente", () => {
        const result = mapRow(baseRow);

        expect(result.author).toEqual({
        user_id: baseRow.author_id,
        username: "maydev",
        full_name: "May",
        profile_pic: "https://example.com/pic.jpg",
        });
    });

    it("convierte likes_count, comments_count y shares_count a número", () => {
    const result = mapRow(baseRow);

        expect(result.likes_count).toBe(5);
        expect(result.comments_count).toBe(3);
        expect(result.shares_count).toBe(1);
        expect(typeof result.likes_count).toBe("number");
    });

    it("convierte liked_by_me a booleano", () => {
        const result = mapRow(baseRow);
        expect(result.liked_by_me).toBe(true);
        expect(typeof result.liked_by_me).toBe("boolean");
    });

    it("usa null cuando media es undefined", () => {
        const result = mapRow({ ...baseRow, media: undefined });
        expect(result.media).toBeNull();
    });

    it("usa null cuando media_type es undefined", () => {
        const result = mapRow({ ...baseRow, media_type: undefined });
        expect(result.media_type).toBeNull();
    });

    it("usa null cuando description es undefined", () => {
        const result = mapRow({ ...baseRow, description: undefined });
        expect(result.description).toBeNull();
    });

    it("usa null cuando content es undefined", () => {
        const result = mapRow({ ...baseRow, content: undefined });
        expect(result.content).toBeNull();
    });

    it("usa null cuando author_pic es undefined", () => {
        const result = mapRow({ ...baseRow, author_pic: undefined });
        expect(result.author.profile_pic).toBeNull();
    });

    it("usa null cuando owner_pic es undefined", () => {
        const result = mapRow({ ...baseRow, owner_pic: undefined });
        expect(result.account_owner.profile_pic).toBeNull();
    });

    it("usa 0 cuando likes_count es undefined", () => {
        const result = mapRow({ ...baseRow, likes_count: undefined });
        expect(result.likes_count).toBe(0);
    });

    it("convierte liked_by_me false correctamente", () => {
        const result = mapRow({ ...baseRow, liked_by_me: false });
        expect(result.liked_by_me).toBe(false);
    });
});