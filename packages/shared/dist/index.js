"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Hex = exports.routeTask = exports.jobReceiptSchema = exports.jobRequestSchema = exports.jobSizeClassSchema = void 0;
const zod_1 = require("zod");
exports.jobSizeClassSchema = zod_1.z.union([
    zod_1.z.literal("small"),
    zod_1.z.literal("medium"),
    zod_1.z.literal("large"),
]);
exports.jobRequestSchema = zod_1.z.object({
    cid_code: zod_1.z.string(),
    cid_input: zod_1.z.string().optional(),
    max_fee: zod_1.z.number().nonnegative(),
    size_class: exports.jobSizeClassSchema,
    redundancy: zod_1.z.union([zod_1.z.literal("auto"), zod_1.z.literal("force")]).optional(),
});
exports.jobReceiptSchema = zod_1.z.object({
    job_id: zod_1.z.string(),
    input_hash: zod_1.z.string(),
    output_hash: zod_1.z.string().optional(),
    status: zod_1.z.union([
        zod_1.z.literal("pending"),
        zod_1.z.literal("success"),
        zod_1.z.literal("failed"),
        zod_1.z.literal("needs-verify"),
    ]),
    node_id: zod_1.z.string(),
    fee_paid: zod_1.z.number().nonnegative(),
});
function routeTask(req) {
    if (req.size_class === "small")
        return "browser";
    if (req.redundancy === "force")
        return "multi";
    return "single";
}
exports.routeTask = routeTask;
var hash_1 = require("./hash");
Object.defineProperty(exports, "sha256Hex", { enumerable: true, get: function () { return hash_1.sha256Hex; } });
