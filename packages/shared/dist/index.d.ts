import { z } from "zod";
export declare const jobSizeClassSchema: z.ZodUnion<[z.ZodLiteral<"small">, z.ZodLiteral<"medium">, z.ZodLiteral<"large">]>;
export declare const jobRequestSchema: z.ZodObject<{
    cid_code: z.ZodString;
    cid_input: z.ZodOptional<z.ZodString>;
    max_fee: z.ZodNumber;
    size_class: z.ZodUnion<[z.ZodLiteral<"small">, z.ZodLiteral<"medium">, z.ZodLiteral<"large">]>;
    redundancy: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"auto">, z.ZodLiteral<"force">]>>;
}, "strip", z.ZodTypeAny, {
    cid_code: string;
    max_fee: number;
    size_class: "small" | "medium" | "large";
    cid_input?: string | undefined;
    redundancy?: "auto" | "force" | undefined;
}, {
    cid_code: string;
    max_fee: number;
    size_class: "small" | "medium" | "large";
    cid_input?: string | undefined;
    redundancy?: "auto" | "force" | undefined;
}>;
export declare const jobReceiptSchema: z.ZodObject<{
    job_id: z.ZodString;
    input_hash: z.ZodString;
    output_hash: z.ZodOptional<z.ZodString>;
    status: z.ZodUnion<[z.ZodLiteral<"pending">, z.ZodLiteral<"success">, z.ZodLiteral<"failed">, z.ZodLiteral<"needs-verify">]>;
    node_id: z.ZodString;
    fee_paid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "success" | "failed" | "needs-verify";
    job_id: string;
    input_hash: string;
    node_id: string;
    fee_paid: number;
    output_hash?: string | undefined;
}, {
    status: "pending" | "success" | "failed" | "needs-verify";
    job_id: string;
    input_hash: string;
    node_id: string;
    fee_paid: number;
    output_hash?: string | undefined;
}>;
export type JobRequest = z.infer<typeof jobRequestSchema>;
export type JobReceipt = z.infer<typeof jobReceiptSchema>;
export type JobSizeClass = z.infer<typeof jobSizeClassSchema>;
export declare function routeTask(req: JobRequest): "browser" | "single" | "multi";
export { sha256Hex } from './hash';
