/** The parts of a Gemini image answer this reads (a generateContent response, as relayed by the server). */
export interface ImagePart {
  text?: string;
  inlineData?: { data?: string; mimeType?: string };
  /** set on the draft images a thinking model makes before the final one */
  thought?: boolean;
}

export interface ImageCandidate {
  content?: { parts?: ImagePart[] };
}

/**
 * The finished image of a Gemini answer, as a data URL, or null when there is none. Google's current image models
 * think first and may send up to two draft images, flagged as thoughts, before the final one: drafts are skipped and
 * the last finished image is taken.
 */
export function finalImage(candidates: ImageCandidate[] | undefined): string | null {
  const images = (candidates ?? []).flatMap((candidate) => candidate.content?.parts ?? []).filter((part) => part.inlineData?.data);
  const finished = images.filter((part) => !part.thought);
  // plain indexing rather than .at(): older phone browsers lack it
  const final = finished[finished.length - 1] ?? images[images.length - 1];
  if (!final?.inlineData?.data) return null;
  return `data:${final.inlineData.mimeType || 'image/png'};base64,${final.inlineData.data}`;
}
