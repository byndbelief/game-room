/** @startingPoint section="Home" subtitle="The big linked panel to the game room" viewport="1000x360" */
export interface GamesDoorProps {
  title?: React.ReactNode;
  desc?: React.ReactNode;
  go?: React.ReactNode;
  /** Glass list items; arcade = muted, regular weight. */
  games?: Array<{ icon: React.ReactNode; name: React.ReactNode; arcade?: boolean }>;
  href?: string;
  style?: React.CSSProperties;
}
export declare function GamesDoor(props: GamesDoorProps): JSX.Element;
