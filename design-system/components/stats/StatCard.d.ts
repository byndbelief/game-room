export interface StatCardProps {
  name: React.ReactNode;
  /** You: gold border + ring. */
  me?: boolean;
  /** Big Unbounded numbers with a muted label. */
  stats?: Array<{ value: React.ReactNode; label: React.ReactNode }>;
  /** Per-game line, e.g. "⚓ 4", "⛳ 2". */
  kinds?: React.ReactNode[];
  /** Hot pill, e.g. "🔥 3 in a row". */
  streak?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
