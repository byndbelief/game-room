export interface HubTileProps {
  /** Unicode glyph, e.g. "◎", "✎", "›_", "{ }", "◫", "◉". */
  glyph?: React.ReactNode;
  title: React.ReactNode;
  desc?: React.ReactNode;
  /** Monospace hostname at the foot, e.g. "os.r4box.com". */
  host?: string;
  /** Tile accent (glyph tint, hover border + 7% wash). Default violet. */
  color?: string;
  href?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}
export declare function HubTile(props: HubTileProps): JSX.Element;
