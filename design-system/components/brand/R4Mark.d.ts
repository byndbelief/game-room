export interface R4MarkProps {
  /** Font size in px; the box glyph scales with it. Default 22. */
  size?: number;
  /** Small caps tag after the word. Default "r = 4". Pass "" to hide. */
  sub?: string;
  /** Slow 18s hue-rotate on the glyph. Default true. */
  spin?: boolean;
  href?: string;
  style?: React.CSSProperties;
}
export declare function R4Mark(props: R4MarkProps): JSX.Element;
