import { signIn, signOut } from "@/services/supabase/auth/auth.sign-in";
import { createFragment, editFragment, deleteFragment } 
    from "@/services/supabase/posts/fragment";
import { supabaseAdmin } from "../helpers/supabase-test-client";
import { setupFriends, cleanupFriends, USER_A, USER_B } 
    from "../helpers/posts-test-setup";

beforeAll(async () => {
    await setupFriends();
});

afterAll(async () => {
    await cleanupFriends();
});

afterEach(async () => {
    await signOut();
    await supabaseAdmin.from("fragments")
        .delete()
        .in("author_id", [USER_A.user_id, USER_B.user_id]);
});

describe("createFragment — integration", () => {
    it("user A can write a fragment on user B's profile", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const result = await createFragment(USER_B.user_id, "hola amigo");

        expect(result.error).toBeNull();
        expect(result.data?.content).toBe("hola amigo");
        expect(result.data?.author_id).toBe(USER_A.user_id);
    });

    it("fragment is saved in the database", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        await createFragment(USER_B.user_id, "guardado en bd");

        const { data } = await supabaseAdmin
            .from("fragments")
            .select("*")
            .eq("account_owner_id", USER_B.user_id)
            .eq("author_id", USER_A.user_id)
            .single();

        expect(data?.content).toBe("guardado en bd");
    });

    it("returns error when posting on own profile", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const result = await createFragment(USER_A.user_id, "esto no debería funcionar");

        expect(result.error).toBe("No puedes publicar en tu propio perfil.");
    });
});

describe("editFragment — integration", () => {
    it("author can edit their fragment", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const { data: fragment } = await createFragment(USER_B.user_id, "original");
        const result = await editFragment(fragment!.fragment_id, "editado");

        expect(result.error).toBeNull();
        expect(result.data?.content).toBe("editado");
    });

    it("user B cannot edit user A's fragment", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });
        const { data: fragment } = await createFragment(USER_B.user_id, "original");
        await signOut();

        await signIn({ email: USER_B.email, password: USER_B.password });
        const result = await editFragment(fragment!.fragment_id, "intento editar");

        expect(result.error).toBe("Fragment no encontrado o sin permisos.");
    });
});

describe("deleteFragment — integration", () => {
    it("author can delete their fragment", async () => {
        await signIn({ email: USER_A.email, password: USER_A.password });

        const { data: fragment } = await createFragment(USER_B.user_id, "para borrar");
        const result = await deleteFragment(fragment!.fragment_id);

        expect(result.error).toBeNull();

        const { data } = await supabaseAdmin
            .from("fragments")
            .select("*")
            .eq("fragment_id", fragment!.fragment_id)
            .single();

        expect(data).toBeNull();
    });
});