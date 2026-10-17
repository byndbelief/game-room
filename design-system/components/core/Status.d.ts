export interface StatusProps {
  /** info: raised panel. bad: hot-soft. good: gold. */
  tone?: 'info' | 'bad' | 'good';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Status(props: StatusProps): JSX.Element;
