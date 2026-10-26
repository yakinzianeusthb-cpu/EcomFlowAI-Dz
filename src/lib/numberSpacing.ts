const NBSP = ' ';

/**
 * Joins the groups of a number written with spaces ("2 900") with a no-break space. In right-to-left text the
 * browser and the canvas otherwise show the groups in reverse ("900 2"). A no-break space counts as a number
 * separator for the bidi rules, so the number stays whole, and it never breaks across two lines either.
 */
export function keepNumbersTogether(text: string): string {
  return text.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`);
}

/**
 * Writes the groups of a spaced number together ("2 900" → "2900"), for text that passes through a service which
 * turns no-break spaces back into plain ones, like WhatsApp's link redirect.
 */
export function joinDigitGroups(text: string): string {
  return text.replace(/(\d)[  ](?=\d{3}(?!\d))/g, '$1');
}
