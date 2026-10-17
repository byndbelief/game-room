export interface BoardCellProps {
  state?: 'water' | 'ship' | 'miss' | 'hit' | 'sunk' | 'aim' | 'peek';
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function BoardCell(props: BoardCellProps): JSX.Element;
