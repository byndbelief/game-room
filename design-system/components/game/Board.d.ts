/** @startingPoint section="Game" subtitle="Battleship grid with hits, misses and aim" viewport="700x460" */
export interface BoardProps {
  /** Squares per side: 10 classic, 12 / 16 for the shared ocean. */
  size?: number;
  /** Map of "A1"… to a BoardCell state. */
  cells?: Record<string, 'water' | 'ship' | 'miss' | 'hit' | 'sunk' | 'aim' | 'peek'>;
  onCell?: (key: string) => void;
  labels?: boolean;
  style?: React.CSSProperties;
}
export declare function Board(props: BoardProps): JSX.Element;
