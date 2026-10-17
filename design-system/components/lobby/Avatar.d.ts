export interface AvatarProps {
  name?: string;
  /** Photo avatar (object-fit cover). */
  src?: string;
  /** Emoji avatar on a panel disc. */
  emoji?: string;
  /** 24 = mini, 34 = who's-here, 36 = ready roll, 64 = profile. */
  size?: number;
  /** true: green ring. false: greyed (away). undefined: plain. */
  online?: boolean;
  style?: React.CSSProperties;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
