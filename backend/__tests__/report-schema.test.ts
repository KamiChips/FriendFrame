import { describe, it, expect } from "vitest";
import { Report } from "../src/schemas/report-schema.js";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

const validBody = {
    target_id: VALID_ID,
    target_type: "post",
    reason: "spam",
};

// Returns failed fields
const failedFields = (input: unknown) => {
    const r = Report.safeParse(input);
    if (r.success) return null;
    return r.error.issues.map((i) => i.path.join("."));
};

describe("Report schema", () => {
    it("passes with valid body", () => {
        expect(Report.safeParse(validBody).success).toBe(true);
    });

    it("passes with valid body and optional fields", () => {
        const r = Report.safeParse({ ...validBody, details: "super detailed text" });
        expect(r.success).toBe(true);
        if (r.success) expect(r.data.details).toBe("super detailed text");
    });

    it("fails with invalid target_id", () => {
        expect(failedFields({ ...validBody, target_id: "foo" })).toEqual(["target_id"]);
    });

    it('SQLi is prevented', () => {
        expect(failedFields({ ...validBody, target_id: "1; DROP TABLE users" })).toEqual(["target_id"]);
    });

    it("fails with an unknown target_type", () => {
        expect(failedFields({ ...validBody, target_type: "abc" })).toEqual(["target_type"]);
    });

    it("fails with an unkown reason", () => {
        expect(failedFields({ ...validBody, reason: "aburrimiento" })).toEqual(["reason"]);
    });

    it("fails when details exceeds character limit", () => {
        expect(failedFields({ ...validBody, details: "a".repeat(501) })).toEqual(["details"]);
    });

    it("passes when details is at the limit (500)", () => {
        expect(Report.safeParse({ ...validBody, details: "a".repeat(500) }).success).toBe(true);
    });

    it("fails when body contains extra fields not in shcema", () => {
        const r = Report.safeParse({ ...validBody, resolved: true });
        expect(r.success).toBe(false);
        if (!r.success) expect(r.error.issues[0].code).toBe("unrecognized_keys");
    });

    it("fails when required field is missing", () => {
        const { reason, ...sinReason } = validBody;
        expect(failedFields(sinReason)).toEqual(["reason"]);
    });

    it.each(["post", "fragment", "comment", "message", "profile"])(
        "passes with all target_types and valid body",
        (target_type) => {
            expect(Report.safeParse({ ...validBody, target_type }).success).toBe(true);
        }
    );
});