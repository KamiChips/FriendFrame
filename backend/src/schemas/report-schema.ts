import * as z from "zod";

export const Report = z.strictObject({
    target_id: z.uuid(),
    target_type: z.enum(['post', 'fragment', 'comment', 'message', 'profile']),
    reason: z.enum(['spam', 'scam', 'false account', 'bullying', 'hate speech', 'explicit content']),
    details: z.optional(z.string().max(500)),
});