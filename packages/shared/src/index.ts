import { z } from "zod";
export const jobSizeClassSchema = z.union([
  z.literal("small"),
  z.literal("medium"),
  z.literal("large"),
]);
export const jobRequestSchema = z.object({
  cid_code: z.string(),
  cid_input: z.string().optional(),
  max_fee: z.number().nonnegative(),
  size_class: jobSizeClassSchema,
  redundancy: z.union([z.literal("auto"), z.literal("force")]).optional(),
});
export const jobReceiptSchema = z.object({
  job_id: z.string(),
  input_hash: z.string(),
  output_hash: z.string().optional(),
  status: z.union([
    z.literal("pending"),
    z.literal("success"),
    z.literal("failed"),
    z.literal("needs-verify"),
  ]),
  node_id: z.string(),
  fee_paid: z.number().nonnegative(),
});
export type JobRequest = z.infer<typeof jobRequestSchema>;
export type JobReceipt = z.infer<typeof jobReceiptSchema>;
export type JobSizeClass = z.infer<typeof jobSizeClassSchema>;
export function routeTask(req: JobRequest): "browser" | "single" | "multi" {
  if (req.size_class === "small") return "browser";
  if (req.redundancy === "force") return "multi";
  return "single";
}

export { sha256Hex } from './hash';
