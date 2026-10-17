/** @startingPoint section="Core" subtitle="Buttons: default, primary, fire, danger, link" viewport="700x200" */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** default: panel + line border. primary: companion colour (teal by default). fire: hot red, Unbounded, pulses. danger: red text. link: underlined teal text. */
  variant?: 'default' | 'primary' | 'fire' | 'danger' | 'link';
  size?: 'md' | 'sm';
  /** Unbounded face, 46px tall — the sign-in / big-action treatment. */
  display?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
