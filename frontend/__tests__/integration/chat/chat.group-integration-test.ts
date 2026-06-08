import {
  addMemberToGroup,
  leaveGroup,
} from "@/services/supabase/chat/chat.group";

// Mocks de Supabase
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Mocks de helpers
jest.mock("@/services/supabase/helpers/validation", () => ({
  assertUUID:  jest.fn(),
  getAuthUser: jest.fn().mockResolvedValue("aaaaaaaa-0000-0000-0000-000000000001"),
}));

jest.mock("@/services/supabase/chat/chat.helpers", () => ({
  assertFriendship: jest.fn().mockResolvedValue(undefined),
  assertMembership: jest.fn().mockResolvedValue(undefined),
  parseError:       jest.fn((err: any) => err?.message ?? String(err)),
}));

// Imports post-mock
import { assertUUID, getAuthUser } from "@/services/supabase/helpers/validation";
import { assertFriendship, assertMembership, parseError } from "@/services/supabase/chat/chat.helpers";

// Constantes
const ME      = "aaaaaaaa-0000-0000-0000-000000000001";
const FRIEND  = "bbbbbbbb-0000-0000-0000-000000000002";
const CHAT_ID = "cccccccc-0000-0000-0000-000000000003";

// Helpers de setup
/** Cadena .select().eq().single() para la query de verificación del chat */
function setupChatQuery(is_group: boolean | null) {
  const singleFn = jest.fn().mockResolvedValueOnce({
    data:  is_group !== null ? { is_group } : null,
    error: null,
  });
  const eqFn     = jest.fn().mockReturnValue({ single: singleFn });
  const selectFn = jest.fn().mockReturnValue({ eq: eqFn });
  return selectFn;
}

/** Cadena .insert() directo en chat_members */
function setupMembersInsert(error: Error | null = null) {
  return jest.fn().mockResolvedValueOnce({ error });
}

/** Cadena .delete().eq().eq() para leaveGroup */
function setupDeleteChain(error: Error | null = null) {
  const finalEqFn  = jest.fn().mockResolvedValueOnce({ error });
  const firstEqFn  = jest.fn().mockReturnValue({ eq: finalEqFn });
  const deleteFn   = jest.fn().mockReturnValue({ eq: firstEqFn });
  mockFrom.mockReturnValue({ delete: deleteFn });
  return { deleteFn, firstEqFn, finalEqFn };
}

// addMemberToGroup
describe("addMemberToGroup", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (getAuthUser as jest.Mock).mockResolvedValue(ME);
      (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
    });

    it("añade un miembro correctamente a un grupo", async () => {
      const selectFn = setupChatQuery(true);
      const insertFn = setupMembersInsert(null);

      mockFrom.mockImplementation((table: string) => {
        if (table === "chat")         return { select: selectFn };
        if (table === "chat_members") return { insert: insertFn };
      });

      const { data, error } = await addMemberToGroup(CHAT_ID, FRIEND);

      expect(error).toBeNull();
      expect(data).toBeNull();
    });

    it("verifica que el usuario actual es miembro del grupo antes de añadir", async () => {
      const selectFn = setupChatQuery(true);
      const insertFn = setupMembersInsert(null);

      mockFrom.mockImplementation((table: string) => {
        if (table === "chat")         return { select: selectFn };
        if (table === "chat_members") return { insert: insertFn };
      });

      await addMemberToGroup(CHAT_ID, FRIEND);

      expect(assertMembership).toHaveBeenCalledWith(CHAT_ID, ME);
    });

    it("verifica la amistad entre el usuario actual y el nuevo miembro", async () => {
      const selectFn = setupChatQuery(true);
      const insertFn = setupMembersInsert(null);

      mockFrom.mockImplementation((table: string) => {
        if (table === "chat")         return { select: selectFn };
        if (table === "chat_members") return { insert: insertFn };
      });

      await addMemberToGroup(CHAT_ID, FRIEND);

      expect(assertFriendship).toHaveBeenCalledWith(ME, FRIEND);
    });

    it("inserta con el chat_id y user_id correctos", async () => {
      const selectFn = setupChatQuery(true);
      const insertFn = setupMembersInsert(null);

      mockFrom.mockImplementation((table: string) => {
        if (table === "chat")         return { select: selectFn };
        if (table === "chat_members") return { insert: insertFn };
      });

      await addMemberToGroup(CHAT_ID, FRIEND);

      expect(insertFn).toHaveBeenCalledWith({ chat_id: CHAT_ID, user_id: FRIEND });
    });

    it("valida ambos UUIDs antes de cualquier otra operación", async () => {
      const selectFn = setupChatQuery(true);
      const insertFn = setupMembersInsert(null);

      mockFrom.mockImplementation((table: string) => {
        if (table === "chat")         return { select: selectFn };
        if (table === "chat_members") return { insert: insertFn };
      });

      await addMemberToGroup(CHAT_ID, FRIEND);

      expect(assertUUID).toHaveBeenCalledWith(CHAT_ID, "chatId");
      expect(assertUUID).toHaveBeenCalledWith(FRIEND, "ID de usuario");
    });

    it("retorna error si el chat no es un grupo (is_group: false)", async () => {
      mockFrom.mockReturnValue({ select: setupChatQuery(false) });

      const { data, error } = await addMemberToGroup(CHAT_ID, FRIEND);

      expect(data).toBeNull();
      expect(error).toMatch(/grupos/i);
    });

    it("retorna error si el chat no existe (data null)", async () => {
      mockFrom.mockReturnValue({ select: setupChatQuery(null) });

      const { data, error } = await addMemberToGroup(CHAT_ID, FRIEND);

      expect(data).toBeNull();
      expect(error).toMatch(/grupos/i);
    });

    it("no intenta insertar si el chat no es un grupo", async () => {
      mockFrom.mockReturnValue({ select: setupChatQuery(false) });
      const insertFn = jest.fn();

      await addMemberToGroup(CHAT_ID, FRIEND);

      expect(insertFn).not.toHaveBeenCalled();
    });

    it("retorna error si assertMembership lanza (el usuario no es miembro)", async () => {
      (assertMembership as jest.Mock).mockRejectedValueOnce(new Error("No eres miembro"));
      mockFrom.mockReturnValue({ select: setupChatQuery(true) });

      const { data, error } = await addMemberToGroup(CHAT_ID, FRIEND);

      expect(data).toBeNull();
      expect(error).toMatch(/miembro/i);
    });

    it("retorna error si assertFriendship lanza (no son amigos)", async () => {
      (assertFriendship as jest.Mock).mockRejectedValueOnce(new Error("No son amigos"));
      const selectFn = setupChatQuery(true);
      mockFrom.mockReturnValue({ select: selectFn });

      const { data, error } = await addMemberToGroup(CHAT_ID, FRIEND);

      expect(data).toBeNull();
      expect(error).toMatch(/amigos/i);
    });

    it("retorna error si Supabase falla al insertar el miembro", async () => {
      const selectFn = setupChatQuery(true);
      const insertFn = setupMembersInsert(new Error("Insert failed"));

      mockFrom.mockImplementation((table: string) => {
        if (table === "chat")         return { select: selectFn };
        if (table === "chat_members") return { insert: insertFn };
      });

      const { data, error } = await addMemberToGroup(CHAT_ID, FRIEND);

      expect(data).toBeNull();
      expect(error).toBe("Insert failed");
    });
});

// leaveGroup
describe("leaveGroup", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (getAuthUser as jest.Mock).mockResolvedValue(ME);
      (parseError as jest.Mock).mockImplementation((err: any) => err?.message ?? String(err));
    });

    it("sale del grupo correctamente", async () => {
      setupDeleteChain(null);

      const { data, error } = await leaveGroup(CHAT_ID);

      expect(error).toBeNull();
      expect(data).toBeNull();
    });

    it("filtra por chat_id correcto en el delete", async () => {
      const { firstEqFn } = setupDeleteChain(null);

      await leaveGroup(CHAT_ID);

      expect(firstEqFn).toHaveBeenCalledWith("chat_id", CHAT_ID);
    });

    it("filtra por el user_id del usuario autenticado", async () => {
      const { finalEqFn } = setupDeleteChain(null);

      await leaveGroup(CHAT_ID);

      expect(finalEqFn).toHaveBeenCalledWith("user_id", ME);
    });

    it("valida el UUID del chatId", async () => {
      setupDeleteChain(null);

      await leaveGroup(CHAT_ID);

      expect(assertUUID).toHaveBeenCalledWith(CHAT_ID, "chatId");
    });

    it("usa el usuario autenticado, no uno hardcodeado", async () => {
      const OTRO_USER = "99999999-0000-0000-0000-000000000009";
      (getAuthUser as jest.Mock).mockResolvedValueOnce(OTRO_USER);
      const { finalEqFn } = setupDeleteChain(null);

      await leaveGroup(CHAT_ID);

      expect(finalEqFn).toHaveBeenCalledWith("user_id", OTRO_USER);
    });

    it("retorna error si Supabase falla al eliminar", async () => {
      setupDeleteChain(new Error("Delete failed"));

      const { data, error } = await leaveGroup(CHAT_ID);

      expect(data).toBeNull();
      expect(error).toBe("Delete failed");
    });

    it("retorna error si assertUUID lanza (chatId inválido)", async () => {
      (assertUUID as jest.Mock).mockImplementationOnce(() => {
        throw new Error("UUID inválido");
      });

      const { data, error } = await leaveGroup("no-es-un-uuid");

      expect(data).toBeNull();
      expect(error).toMatch(/uuid/i);
    });

    it("retorna error si getAuthUser lanza (sesión expirada)", async () => {
      (getAuthUser as jest.Mock).mockRejectedValueOnce(new Error("Sesión expirada"));
      // setupDeleteChain no se llama porque el error ocurre antes
      mockFrom.mockReturnValue({ delete: jest.fn() });

      const { data, error } = await leaveGroup(CHAT_ID);

      expect(data).toBeNull();
      expect(error).toMatch(/sesión/i);
    });
});