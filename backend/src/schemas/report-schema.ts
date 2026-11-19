import * as z from "zod";

export const Report = z.strictObject({
    taget_id: z.uuid(),
    target_type: z.enum(['post', 'fragment', 'comment', 'message', 'profile']),
    reason: z.enum(['spam', 'scam', 'false account', 'bullying', 'hate speech', 'explicit content']),
    details: z.optional(z.string().max(500)),
});

// test
const report_schema_tests = () => {
    
    const longStr = "a".repeat(501);

    const inputs = [
        {taget_id: 'foo', target_type: 'post', reason: 'spam'}, // invelid target type
        {taget_id: '550e8400-e29b-41d4-a716-446655440000', target_type: 'abc', reason: 'spam'}, // invvalid target id
        {taget_id: '550e8400-e29b-41d4-a716-446655440000', target_type: 'post', reason: 'spam', details: longStr}, // details max limit exceeded
        {taget_id: '550e8400-e29b-41d4-a716-446655440000', target_type: 'post', reason: 'spam', resolved: true}, // invalid body :(
        {taget_id: '550e8400-e29b-41d4-a716-446655440000', target_type: 'post', reason: 'spam', details: "super detailed text"} // valid body :D
    ]

    const results = inputs.map((input) => Report.safeParse(input));

    for (const [index, result] of results.entries()) {
        if (result.success) {
            console.log(index, "valid", result.data);
        } else {
            console.log(index, "invalid", result.error.issues);
        }
    }
}

report_schema_tests();