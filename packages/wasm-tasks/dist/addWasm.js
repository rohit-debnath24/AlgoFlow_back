// Minimal WASM module (add i32) encoded as base64 to avoid external toolchains.
// (module (func (export "add") (param i32 i32) (result i32) local.get 0 local.get 1 i32.add))
const wasmBase64 = "AGFzbQEAAAABBgFgAX8BfwMCAQAHBwEDYWRkAAkBAQcBIAAgAWoL";
export async function loadAddWasm() {
    const bytes = Uint8Array.from(atob(wasmBase64), (c) => c.charCodeAt(0));
    const { instance } = await WebAssembly.instantiate(bytes, {});
    const add = instance.exports.add;
    return { add };
}
