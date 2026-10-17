export interface EnterButtonProps {
  /** Glass secondary ("🧬 Solo run"). */
  alt?: boolean;
  /** lg = the r4box.com hero CTA (16px 26px, radius 16, lifts 2px on hover). */
  size?: 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function EnterButton(props: EnterButtonProps): JSX.Element;
