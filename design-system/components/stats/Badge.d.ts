export interface BadgeProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  how?: React.ReactNode;
  /** Earned: gold border and warm gradient; otherwise greyed icon. */
  got?: boolean;
  /** 0–1 progress toward earning it. */
  progress?: number;
  count?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
