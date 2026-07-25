/**
 * Serialize a node.
 *
 * @param {Nodes} node
 *   xast node.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized XML.
 */
export function one(node: Nodes, state: State): string;
/**
 * Serialize all children of `parent`.
 *
 * @param {Parents} parent
 *   xast parent node.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized XML.
 */
export function all(parent: Parents, state: State): string;
export type Nodes = import('xast').Nodes;
export type Parents = import('xast').Parents;
export type RootContent = import('xast').RootContent;
export type State = import('./index.js').State;
