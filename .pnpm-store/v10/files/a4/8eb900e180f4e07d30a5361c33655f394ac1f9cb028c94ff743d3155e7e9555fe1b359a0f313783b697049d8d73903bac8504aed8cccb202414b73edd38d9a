/**
 * Serialize a xast tree to XML.
 *
 * @param {Array<Nodes> | Nodes} tree
 *   xast node(s) to serialize.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {string}
 *   Serialized XML.
 */
export function toXml(tree: Array<Nodes> | Nodes, options?: Options | null | undefined): string;
export type Literal = import('xast').Literal;
export type Nodes = import('xast').Nodes;
/**
 * Configuration.
 */
export type Options = {
    /**
     * Allow `raw` nodes and insert them as raw XML (default: `false`).
     *
     * When `false`, `Raw` nodes are encoded.
     *
     * > ⚠️ **Danger**: only set this if you completely trust the content.
     */
    allowDangerousXml?: boolean | null | undefined;
    /**
     * Close elements without any content with slash (`/`) on the opening tag
     * instead of an end tag: `<circle />` instead of `<circle></circle>`
     * (default: `false`).
     *
     * See `tightClose` to control whether a space is used before the slash.
     */
    closeEmptyElements?: boolean | null | undefined;
    /**
     * Preferred quote to use (default: `'"'`).
     */
    quote?: Quote | null | undefined;
    /**
     * Use the other quote if that results in less bytes (default: `false`).
     */
    quoteSmart?: boolean | null | undefined;
    /**
     * Do not use an extra space when closing self-closing elements: `<circle/>`
     * instead of `<circle />` (default: `false`).
     *
     * > 👉 **Note**: only used if `closeEmptyElements: true`.
     */
    tightClose?: boolean | null | undefined;
};
/**
 * XML quotes for attribute values.
 */
export type Quote = '"' | "'";
/**
 * Info passed around about the current state.
 */
export type State = {
    /**
     *   Configuration.
     */
    options: Options;
};
