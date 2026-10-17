export interface UpCardProps {
  kind?: 'battleship' | 'golf' | 'duel' | 'cards' | 'war';
  title: React.ReactNode;
  vs?: React.ReactNode;
  sub?: React.ReactNode;
  /** Red shot-clock text, e.g. "Chaos in 3h". */
  clock?: React.ReactNode;
  /** "Play" or "Place ships". */
  cta?: string;
  href?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}
export declare function UpCard(props: UpCardProps): JSX.Element;
