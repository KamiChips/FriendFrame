import { mapRow, parseError } from "@/services/supabase/feed/feed.helpers";

// No necesita mocks — son funciones puras sin dependencias externas

describe("parseError", () => {
  it("retorna mensaje de red si el error contiene NetworkError", () => {
    const result = parseError(new Error("NetworkError while fetching"));
    expect(result).toBe("Error de red. Verifica tu conexión.");
  });

  it("retorna mensaje de red si el error contiene Failed to fetch", () => {
    const result = parseError(new Error("Failed to fetch"));
    expect(result).toBe("Error de red. Verifica tu conexión.");
  });

  it("retorna mensaje genérico para errores desconocidos", () => {
    const result = parseError(new Error("Algún error raro"));
    expect(result).toBe("No se pudo cargar el feed.");
  });

  it("retorna 'Error desconocido' si err es null", () => {
    const result = parseError(null);
    expect(result).toBe("Error desconocido");
  });

  it("retorna 'Error desconocido' si err es undefined", () => {
    const result = parseError(undefined);
    expect(result).toBe("Error desconocido");
  });

  it("maneja errores que son strings", () => {
    const result = parseError("error en string");
    expect(result).toBe("No se pudo cargar el feed.");
  });
});

describe("mapRow", () => {
  const baseRow = {
    id: "post-123",
    pub_type: "post",
    author_id: "user-1",
    account_owner_id: "user-2",
    media: "https://example.com/image.jpg",
    media_type: "image",
    description: "Descripción del post",
    content: null,
    created_at: "2026-01-01T00:00:00Z",
    author_username: "usuario1",
    author_full_name: "Usuario Uno",
    author_pic: "https://example.com/pic1.jpg",
    owner_username: "usuario2",
    owner_full_name: "Usuario Dos",
    owner_pic: "https://example.com/pic2.jpg",
    likes_count: 5,
    comments_count: 3,
    shares_count: 1,
    liked_by_me: true,
  };

  it("mapea un row de post correctamente", () => {
    const result = mapRow(baseRow);

    expect(result).toEqual({
      id: "post-123",
      type: "post",
      author_id: "user-1",
      account_owner_id: "user-2",
      media: "https://example.com/image.jpg",
      media_type: "image",
      description: "Descripción del post",
      content: null,
      created_at: "2026-01-01T00:00:00Z",
      author: {
        user_id: "user-1",
        username: "usuario1",
        full_name: "Usuario Uno",
        profile_pic: "https://example.com/pic1.jpg",
      },
      account_owner: {
        user_id: "user-2",
        username: "usuario2",
        full_name: "Usuario Dos",
        profile_pic: "https://example.com/pic2.jpg",
      },
      likes_count: 5,
      comments_count: 3,
      shares_count: 1,
      liked_by_me: true,
    });
  });

  it("mapea un row de fragment correctamente", () => {
    const fragmentRow = {
      ...baseRow,
      id: "fragment-456",
      pub_type: "fragment",
      media: null,
      media_type: null,
      description: null,
      content: "Contenido del fragmento",
    };

    const result = mapRow(fragmentRow);

    expect(result.type).toBe("fragment");
    expect(result.content).toBe("Contenido del fragmento");
    expect(result.media).toBeNull();
    expect(result.description).toBeNull();
  });

  it("usa null cuando media es undefined", () => {
    const row = { ...baseRow, media: undefined };
    const result = mapRow(row);
    expect(result.media).toBeNull();
  });

  it("usa null cuando media_type es undefined", () => {
    const row = { ...baseRow, media_type: undefined };
    const result = mapRow(row);
    expect(result.media_type).toBeNull();
  });

  it("usa null cuando description es undefined", () => {
    const row = { ...baseRow, description: undefined };
    const result = mapRow(row);
    expect(result.description).toBeNull();
  });

  it("usa null cuando content es undefined", () => {
    const row = { ...baseRow, content: undefined };
    const result = mapRow(row);
    expect(result.content).toBeNull();
  });

  it("usa null cuando author_pic es undefined", () => {
    const row = { ...baseRow, author_pic: undefined };
    const result = mapRow(row);
    expect(result.author.profile_pic).toBeNull();
  });

  it("usa null cuando owner_pic es undefined", () => {
    const row = { ...baseRow, owner_pic: undefined };
    const result = mapRow(row);
    expect(result.account_owner.profile_pic).toBeNull();
  });

  it("convierte likes_count a número", () => {
    const row = { ...baseRow, likes_count: "10" };
    const result = mapRow(row);
    expect(typeof result.likes_count).toBe("number");
    expect(result.likes_count).toBe(10);
  });

  it("usa 0 cuando likes_count es undefined", () => {
    const row = { ...baseRow, likes_count: undefined };
    const result = mapRow(row);
    expect(result.likes_count).toBe(0);
  });

  it("usa 0 cuando comments_count es undefined", () => {
    const row = { ...baseRow, comments_count: undefined };
    const result = mapRow(row);
    expect(result.comments_count).toBe(0);
  });

  it("usa 0 cuando shares_count es undefined", () => {
    const row = { ...baseRow, shares_count: undefined };
    const result = mapRow(row);
    expect(result.shares_count).toBe(0);
  });

  it("convierte liked_by_me a boolean", () => {
    const row = { ...baseRow, liked_by_me: 1 };
    const result = mapRow(row);
    expect(typeof result.liked_by_me).toBe("boolean");
    expect(result.liked_by_me).toBe(true);
  });

  it("liked_by_me es false cuando es 0", () => {
    const row = { ...baseRow, liked_by_me: 0 };
    const result = mapRow(row);
    expect(result.liked_by_me).toBe(false);
  });
});