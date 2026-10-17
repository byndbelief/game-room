export interface QuickEntryProps {
  /** Emoji in a 44px glass square. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  href?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}
export declare function QuickEntry(props: QuickEntryProps): JSX.Element;
