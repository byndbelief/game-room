export interface BotStepProps {
  value?: number;
  max?: number;
  onChange?: (n: number) => void;
  label?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function BotStep(props: BotStepProps): JSX.Element;
