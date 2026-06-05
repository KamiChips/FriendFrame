import {
  assertUUIDs,
  normalizePagination,
  parseError,
  assertFriendship,
  assertMembership,
  findExistingDirectChat,
  getChatById,
} from "@/services/supabase/chat/chat.helpers"

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();
const mockLimit = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = jest.fn(() => ({ limit: mockLimit }));
const mockNeq = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

// ─── Constantes ──────────────────────────────────────────────────────────────

const USER_A  = "550e8400-e29b-41d4-a716-446655440000";
const USER_B  = "6ba7b810-9dad-41d4-80b4-00c04fd430c8";
const CHAT_ID = "6ba7b814-9dad-41d4-80b4-00c04fd430c8";

beforeEach(() => jest.clearAllMocks());

// ─── assertUUIDs ──────────────────────────────────────────────────────────────

describe("assertUUIDs", () => {
  it("no lanza error con UUIDs válidos", () => {
    expect(() => assertUUIDs([USER_A, USER_B])).not.toThrow();
  });

  it("lanza error con un UUID inválido", () => {
    expect(() => assertUUIDs(["not-a-uuid"])).toThrow(/inválido/i);
  });

  it("incluye el índice en el mensaje de error", () => {
    expect(() => assertUUIDs([USER_A, "bad"])).toThrow(/\[1\]/);
  });

  it("usa el label personalizado en el error", () => {
    expect(() => assertUUIDs(["bad"], "MiLabel")).toThrow(/MiLabel/);
  });
})