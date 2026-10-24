/**
 * A video script as plain text to paste anywhere (a video tool, a message to the actor): each scene's parts under
 * their headings, in the seller's language. Empty parts are left out.
 */
export interface ScriptTextLabels {
  scene: (n: number) => string;
  visual: string;
  actor: string;
  voice: string;
  franco: string;
  overlay: string;
}

interface SceneLike {
  step?: string;
  time?: string;
  visual?: string;
  actorDirection?: string;
  audio?: string;
  audioFranco?: string;
  overlay?: string;
  sfxMusic?: string;
}

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** One scene: its title line, then each part that has words, under its heading. */
export function sceneToText(scene: SceneLike, index: number, labels: ScriptTextLabels): string {
  const step = clean(scene.step);
  const time = clean(scene.time);
  const title = `${labels.scene(index + 1)}${step ? ` — ${step}` : ''}${time ? ` (${time})` : ''}`;
  const parts = [
    [labels.visual, scene.visual],
    [labels.actor, scene.actorDirection],
    [labels.voice, scene.audio],
    [labels.franco, scene.audioFranco],
  ]
    .map(([heading, text]) => [heading, clean(text)] as const)
    .filter(([, text]) => text)
    .map(([heading, text]) => `${heading.replace(/\s*:$/, '')}:\n${text}`);
  const notes = [
    clean(scene.overlay) && `${labels.overlay} ${clean(scene.overlay)}`,
    clean(scene.sfxMusic) && `SFX: ${clean(scene.sfxMusic)}`,
  ].filter(Boolean);
  return [title, ...parts, ...(notes.length ? [notes.join('\n')] : [])].join('\n\n');
}

/** The whole script: its title, then every scene, two blank lines apart. */
export function scriptToText(script: { title?: string; scenes?: SceneLike[] }, labels: ScriptTextLabels): string {
  const scenes = (script.scenes ?? []).map((scene, i) => sceneToText(scene, i, labels)).join('\n\n\n');
  return [clean(script.title), scenes].filter(Boolean).join('\n\n');
}
