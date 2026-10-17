export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  /** teal: lobby choices (teal border, water fill). gold: the Route to Chaos opponent picker (solid gold). */
  tone?: 'teal' | 'gold';
  children?: React.ReactNode;
}
export declare function Chip(props: ChipProps): JSX.Element;
