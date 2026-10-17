/** @startingPoint section="Lobby" subtitle="Pick-a-game preview card" viewport="700x320" */
export interface GameCardProps {
  kind?: 'battleship' | 'golf' | 'duel' | 'cards' | 'war';
  icon?: React.ReactNode;
  /** e.g. "⚓ Battleship" */
  name: React.ReactNode;
  blurb?: React.ReactNode;
  /** Eyebrow line, e.g. "2–3 players". */
  who?: React.ReactNode;
  checked?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function GameCard(props: GameCardProps): JSX.Element;
