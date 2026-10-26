/**
 * Splits a translated sentence into plain and **bold** parts.
 * A sentence with emphasis inside it must be translated as ONE string: translating the pieces around a <strong>
 * separately gives broken grammar, because the word order differs between French, English and Arabic.
 */
export interface RichTextPart {
  text: string;
  strong: boolean;
}

export function parseRichText(input: string): RichTextPart[] {
  const parts: RichTextPart[] = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of input.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: input.slice(last, match.index), strong: false });
    parts.push({ text: match[1], strong: true });
    last = match.index + match[0].length;
  }
  if (last < input.length) parts.push({ text: input.slice(last), strong: false });
  return parts;
}
