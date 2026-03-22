"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Hex = void 0;
const crypto_1 = require("crypto");
function sha256Hex(data) {
    const hash = (0, crypto_1.createHash)("sha256");
    hash.update(data);
    return hash.digest("hex");
}
exports.sha256Hex = sha256Hex;
