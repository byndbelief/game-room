export interface BifurcationProps {
  /** CSS height in px. Width fills the parent. Default 320. */
  height?: number | string;
  /** Draw left-to-right as r climbs. Default true. */
  animate?: boolean;
  r0?: number;
  r1?: number;
  style?: React.CSSProperties;
}
export declare function Bifurcation(props: BifurcationProps): JSX.Element;
