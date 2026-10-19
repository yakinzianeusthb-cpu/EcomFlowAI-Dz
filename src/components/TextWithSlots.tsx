import { Fragment, type ReactNode } from 'react';

/**
 * Renders a translated sentence that has components inside it, such as links.
 * The translation marks the spots with {name}; each one is replaced by `slots[name]`.
 * Keeping the whole sentence in one translation lets every language put the links where its grammar needs them.
 */
export default function TextWithSlots({ text, slots }: { text: string; slots: Record<string, ReactNode> }) {
  return (
    <>
      {text.split(/(\{\w+\})/g).map((part, index) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1];
        return <Fragment key={index}>{name && name in slots ? slots[name] : part}</Fragment>;
      })}
    </>
  );
}
