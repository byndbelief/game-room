export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  type?: 'text' | 'password';
}
export declare function Field(props: FieldProps): JSX.Element;
