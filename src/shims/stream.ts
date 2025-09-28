export class Readable {
    // no-op buffer so code that calls push() doesn't crash immediately
    private _chunks: unknown[] = [];
    push(chunk: unknown) { if (chunk != null) this._chunks.push(chunk); }
}
export default { Readable };