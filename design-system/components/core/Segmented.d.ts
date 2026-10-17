export interface SegmentedProps {
  options: Array<string | number | { value: string | number; label: React.ReactNode }>;
  value?: string | number;
  onChange?: (v: string | number) => void;
  style?: React.CSSProperties;
}
export declare function Segmented(props: SegmentedProps): JSX.Element;
