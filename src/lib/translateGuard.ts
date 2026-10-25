/**
 * Keeps the app working when the browser translates the page (Google Translate, Chrome, Edge, Safari): the
 * translator replaces text nodes with its own <font> wrappers, and React's next insert or removal next to such a
 * text throws ("insertBefore… is not a child of this node"), which took the whole screen down
 * (https://github.com/facebook/react/issues/11538).
 *
 * With this guard, an insert before a node the translator moved goes before the translator's wrapper (so the order
 * stays right), or at the end when that node is gone from the page; removing a node the translator already took out
 * does nothing. Normal inserts and removals are unchanged.
 */
const GUARDED = Symbol.for('ecomflow.translateGuard');

interface NodeLike {
  parentNode: NodeLike | null;
}
interface NodeMethods {
  insertBefore(node: NodeLike, ref: NodeLike | null): NodeLike;
  removeChild(node: NodeLike): NodeLike;
}

export function guardNodeMethods(proto: NodeMethods & { [GUARDED]?: true }): void {
  if (proto[GUARDED]) return;
  const insertBefore = proto.insertBefore;
  const removeChild = proto.removeChild;

  proto.insertBefore = function (this: NodeMethods & NodeLike, node, ref) {
    if (ref && ref.parentNode !== this) {
      // climb from the moved node to this node's own child that now holds it (the translator's wrapper)
      let anchor: NodeLike | null = ref;
      while (anchor && anchor.parentNode !== this) anchor = anchor.parentNode;
      return insertBefore.call(this, node, anchor);
    }
    return insertBefore.call(this, node, ref);
  };

  proto.removeChild = function (this: NodeMethods & NodeLike, node) {
    if (node.parentNode !== this) return node;
    return removeChild.call(this, node);
  };

  Object.defineProperty(proto, GUARDED, { value: true });
}

/** Guards the page's DOM nodes; called once before the app renders. */
export function installTranslateGuard(): void {
  if (typeof Node === 'function') guardNodeMethods(Node.prototype as unknown as NodeMethods);
}
