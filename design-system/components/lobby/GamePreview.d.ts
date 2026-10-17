export interface GamePreviewProps {
  kind?: 'battleship' | 'golf' | 'duel' | 'cards' | 'war' | 'gauntlet';
  /** CSS aspect-ratio. 16 / 10 everywhere in the lobby. */
  ratio?: string;
  radius?: number;
  /** Replace the emoji with a real preview (img/canvas). */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function GamePreview(props: GamePreviewProps): JSX.Element;
