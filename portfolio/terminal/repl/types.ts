export interface EventMap extends Record<string, unknown> {
  /** The submitted line. */
  submit: string;
}

/** Where Up and Down have got in the command lines, and what was typed before the first Up. */
export interface Recall {
  index: number;
  draft: string;
}

export interface RecallStep {
  /** Null once Down has gone past the newest line. */
  recall: Recall | null;
  value: string;
}
