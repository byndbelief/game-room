/** @startingPoint section="Core" subtitle="Panel card: 18px radius, line border" viewport="700x200" */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Gold border + 2px gold ring (the active target / "me"). */
  selected?: boolean;
  as?: string;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
