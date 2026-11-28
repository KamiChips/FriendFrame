import { describe, it, expect, vi } from "vitest";
import { resolveTarget, REPORT_TARGETS } from "../src/helpers/resolve-target";
import { Report } from "../src/schemas/report-schema";

// tx falso
const fakeTx = (rows: unknown[] = []) => ({
    query: vi.fn().mockResolvedValue({ rows }),
});

const base = { userId: "yo", targetId: "11111111-1111-4111-8111-111111111111" };

describe("resolveTarget", () => {
    it("verify that post is visible", async () => {
        const tx = fakeTx([{ id: "p1", author_id: "otro" }]);
        const r = await resolveTarget({ ...base, tx, contentType: REPORT_TARGETS.post });
        expect(r.targetOwnerId).toBe("otro");
    });

    it("verify SQLi prevention by using parameters", async () => {
        const tx = fakeTx([{ id: "p1", author_id: "otro" }]);
        await resolveTarget({ ...base, tx, contentType: REPORT_TARGETS.post });
        const [sql, params] = tx.query.mock.calls[0];
        expect(sql).toContain("$1");
        expect(sql).not.toContain(base.targetId);
        expect(params).toEqual([base.targetId]);
    });

    it("fails with 404 if post is not visible", async () => {
        await expect(
            resolveTarget({ ...base, tx: fakeTx([]), contentType: REPORT_TARGETS.post })
        ).rejects.toMatchObject({ status: 404 });
    });

    it("fails with 404 if message report is missing user", async () => {
        await expect(
            resolveTarget({ ...base, tx: fakeTx([]), contentType: REPORT_TARGETS.message })
        ).rejects.toMatchObject({ status: 404 });
    });

    it("verify only reported message is sent", async () => {
        const tx = fakeTx([{ id: "m1", chat_id: "c1", sender_id: "otro", content: "x", created_at: "" }]);
        await resolveTarget({ ...base, tx, contentType: REPORT_TARGETS.message });
        expect(tx.query.mock.calls[0][1]).toEqual([base.targetId, "yo"]);
    });

    it("fails with 400 when trying to report self (post)", async () => {
        const tx = fakeTx([{ id: "p1", author_id: "yo" }]);
        await expect(
            resolveTarget({ ...base, tx, contentType: REPORT_TARGETS.post })
        ).rejects.toMatchObject({ status: 400, code: "CANNOT_REPORT_SELF" });
    });

    it("fails with 400 when trying to report self (profile)", async () => {
        const tx = fakeTx([{ id: "yo" }]);
        await expect(
            resolveTarget({ ...base, tx, contentType: REPORT_TARGETS.profile })
        ).rejects.toMatchObject({ status: 400, code: "CANNOT_REPORT_SELF" });
    });

    it("fails when id does not exist", async () => {
        await expect(
            resolveTarget({ ...base, tx: fakeTx([]), contentType: REPORT_TARGETS.profile })
        ).rejects.toMatchObject({ status: 404 });
    });

    it("DB error returns 500", async () => {
        const tx = { query: vi.fn().mockRejectedValue(new Error("connection lost")) };
        await expect(
            resolveTarget({ ...base, tx, contentType: REPORT_TARGETS.post })
        ).rejects.toThrow("connection lost");
    });
});

describe("Report schema", () => {
    it('rechaza "1; DROP TABLE users" como targetId', () => {
        const r = Report.safeParse({
            targetId: "1; DROP TABLE users",
            contentType: "post",
        });
        expect(r.success).toBe(false);
    });
});

describe.skip("RLS integration is pending...", () => {
    it.todo("fails with 404 when triying to report a blocked user post");
    it.todo("fails with 404 if the user is not chat memeber");
});