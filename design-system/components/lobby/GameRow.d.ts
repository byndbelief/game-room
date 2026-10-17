export interface GameRowProps {
  kind?: 'battleship' | 'golf' | 'duel' | 'cards' | 'war' | 'gauntlet';
  /** e.g. "⛳ Putt Post" */
  title: React.ReactNode;
  /** e.g. "vs phoenix_lord" */
  vs?: React.ReactNode;
  sub?: React.ReactNode;
  /** Right-hand state, usually a <Pill>. */
  pill?: React.ReactNode;
  /** 0–1 teal progress bar. */
  progress?: number;
  /** Your move: gold border + 4px gold inset bar. */
  mine?: boolean;
  /** Finished: opacity .75. */
  over?: boolean;
  href?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}
export declare function GameRow(props: GameRowProps): JSX.Element;
