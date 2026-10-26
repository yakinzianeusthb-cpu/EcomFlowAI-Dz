import { describe, expect, it } from 'vitest';
import { guardNodeMethods } from '../../src/lib/translateGuard';

/** A tiny stand-in for DOM nodes: children in order, a parent, and the real methods' refusals. */
class FakeNode {
  parentNode: FakeNode | null = null;
  children: FakeNode[] = [];
  constructor(readonly name: string) {}
  insertBefore(node: FakeNode, ref: FakeNode | null): FakeNode {
    if (ref && ref.parentNode !== this) throw new Error("NotFoundError: insertBefore");
    node.parentNode?.removeChild(node);
    const at = ref ? this.children.indexOf(ref) : this.children.length;
    this.children.splice(at, 0, node);
    node.parentNode = this;
    return node;
  }
  removeChild(node: FakeNode): FakeNode {
    if (node.parentNode !== this) throw new Error("NotFoundError: removeChild");
    this.children.splice(this.children.indexOf(node), 1);
    node.parentNode = null;
    return node;
  }
}
guardNodeMethods(FakeNode.prototype as any);

/** What a page translator does: the text node is taken out and <font><font>translation</font></font> put in its place. */
function translate(text: FakeNode) {
  const parent = text.parentNode!;
  const outer = new FakeNode('font');
  parent.insertBefore(outer, text);
  parent.removeChild(text);
  return outer;
}

describe('guardNodeMethods (page translators)', () => {
  it('inserts before the translator\'s wrapper when the node to insert before was moved inside it', () => {
    const button = new FakeNode('button');
    const icon = new FakeNode('svg');
    const label = new FakeNode('#text');
    button.insertBefore(icon, null);
    button.insertBefore(label, null);
    const font = new FakeNode('font');
    button.insertBefore(font, label);
    button.removeChild(label);
    font.insertBefore(label, null); // the original text now lives inside the wrapper
    const check = new FakeNode('svg-check');
    expect(() => button.insertBefore(check, label)).not.toThrow();
    expect(button.children.map((c) => c.name)).toEqual(['svg', 'svg-check', 'font']);
  });

  it('appends when the node to insert before is no longer in the page at all', () => {
    const p = new FakeNode('p');
    const text = new FakeNode('#text');
    p.insertBefore(text, null);
    translate(text);
    const added = new FakeNode('span');
    expect(() => p.insertBefore(added, text)).not.toThrow();
    expect(p.children.map((c) => c.name)).toEqual(['font', 'span']);
  });

  it('does nothing when asked to remove a node the translator already took out', () => {
    const p = new FakeNode('p');
    const text = new FakeNode('#text');
    p.insertBefore(text, null);
    translate(text);
    expect(() => p.removeChild(text)).not.toThrow();
    expect(p.children.map((c) => c.name)).toEqual(['font']);
  });

  it('leaves normal inserts and removals as they were', () => {
    const ul = new FakeNode('ul');
    const a = new FakeNode('a');
    const b = new FakeNode('b');
    ul.insertBefore(b, null);
    ul.insertBefore(a, b);
    expect(ul.children.map((c) => c.name)).toEqual(['a', 'b']);
    ul.removeChild(a);
    expect(ul.children.map((c) => c.name)).toEqual(['b']);
  });

  it('is applied only once', () => {
    const before = FakeNode.prototype.insertBefore;
    guardNodeMethods(FakeNode.prototype as any);
    expect(FakeNode.prototype.insertBefore).toBe(before);
  });
});
