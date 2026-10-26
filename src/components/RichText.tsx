import { Fragment } from 'react';
import { parseRichText } from '../lib/richText';

/** Renders a translated sentence whose **bold** parts become <strong>. See lib/richText.ts for why it is one string. */
export default function RichText({ text, strongClassName }: { text: string; strongClassName?: string }) {
  return (
    <>
      {parseRichText(text).map((part, index) =>
        part.strong ? (
          <strong key={index} className={strongClassName}>{part.text}</strong>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
