const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A plausible e-mail address. The length check runs first: on a very long input the pattern backtracks for seconds. */
export const isEmailAddress = (value: string): boolean => value.length <= 254 && EMAIL_RE.test(value);
