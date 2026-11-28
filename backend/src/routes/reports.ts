import express, { type Request, type Response, type NextFunction } from "express";
import { Report } from "../schemas/report-schema.js";
import { withUser } from "../db/with-user.js";
import { resolveTarget, HttpError, type REPORT_TARGETS } from "../helpers/resolve-target.js";

const app = express();
app.use(express.json());

interface ReportResponse {
    report_id: string;
    status: string;
}

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === "23505";

// TODO: change for the actual implementation once task [F2-03] is done
async function saveEvidence(reporterId: string | undefined, evidence: unknown) {
    return "";
}

// POST reports
app.post(
    "/reports",
    async (
        req: Request<{}, ReportResponse | { error: unknown }, unknown>, 
        res: Response
    ) => {
        // Validate report 
        const parsed = Report.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "VALIDATION_ERROR", issues: parsed.error.issues });
        }
        const { target_id, target_type, reason, details } = parsed.data;
        const reporterId = req.user?.id;
        if (!reporterId) return res.status(401).json({ error: "UNAUTHORIZED" });

        // Resolve target
        const { reportId, status, evidence } = await withUser(reporterId, async (tx) => {
            const { target } = await resolveTarget({
                tx, 
                userId: reporterId,
                targetId: target_id,
                contentType: target_type as REPORT_TARGETS,
            });

            try {
                const { rows } = await tx.query<{ id: string; status: string }>(
                    `INSERT INTO reports (reporter_id, target_id, target_type, reason, details)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id, status`,
                    [reporterId, target_id, target_type, reason, details ?? null]
                );
                return { reportId: rows[0]?.id, status: rows[0]?.status, evidence: target };
            } catch (e) {
                if (isUniqueViolation(e)) throw new HttpError(409, "ALREADY_REPORTED");
                throw (e);
            }
        })

        // Save evidence in blob
        let evidencePath: string;
        try {
            evidencePath = await saveEvidence(reportId, evidence);
        } catch (err) { // Catch Blob failute & return 503.
            console.error("Blob upload failed", err);
            await withUser(reporterId, (tx) => 
                tx.query("DELETE FROM reports WHERE id = $1 AND reporter_id = $2", [reportId, reporterId])
            ).catch((e) => console.error("Cleanup failed, report left without evidence", reportId, e));
            return res.status(503).json({ error: "EVIDENCE_STORAGE_UNAVAILABLE" });
        }

        // Update evidence_path
        await withUser(reporterId, (tx) => 
            tx.query("UPDATE reports SET evidence_path = $1 WHERE id = $2", [evidencePath, reportId])
        );

        // Return 201 { report_id, status }
        return res.status(201).json({ report_id: reportId, status });
    }
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.code });

    console.error(err);
    res.status(500).json({ error: "Internal Sever Error" });
});