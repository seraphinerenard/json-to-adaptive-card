export interface AdaptiveCardOptions {
  /** Optional title displayed at the top of the card */
  title?: string;
  /** Maximum nesting depth for recursive conversion (default: 5) */
  maxDepth?: number;
  /** Visual theme for the card layout */
  theme?: "default" | "compact" | "detailed";
  /** Whether to include null values in the output (default: false) */
  includeNulls?: boolean;
  /** Date format hint (default: locale string) */
  dateFormat?: string;
  /** Column width strategy for table layouts */
  columnWidth?: "auto" | "stretch";
}

export interface AdaptiveCard {
  type: "AdaptiveCard";
  version: "1.6";
  $schema: string;
  body: CardElement[];
  actions?: CardAction[];
}

export interface TextBlock {
  type: "TextBlock";
  text: string;
  weight?: "Default" | "Bolder" | "Lighter";
  size?: "Default" | "Small" | "Medium" | "Large" | "ExtraLarge";
  color?: "Default" | "Dark" | "Light" | "Accent" | "Good" | "Warning" | "Attention";
  wrap?: boolean;
  isSubtle?: boolean;
  separator?: boolean;
  spacing?: Spacing;
  selectAction?: OpenUrlAction;
  fontType?: "Default" | "Monospace";
}

export interface Image {
  type: "Image";
  url: string;
  size?: "Auto" | "Stretch" | "Small" | "Medium" | "Large";
  altText?: string;
  separator?: boolean;
  spacing?: Spacing;
}

export interface Container {
  type: "Container";
  items: CardElement[];
  separator?: boolean;
  spacing?: Spacing;
  style?: "default" | "emphasis" | "good" | "attention" | "warning" | "accent";
}

export interface FactSet {
  type: "FactSet";
  facts: Fact[];
  separator?: boolean;
  spacing?: Spacing;
}

export interface Fact {
  title: string;
  value: string;
}

export interface ColumnSet {
  type: "ColumnSet";
  columns: Column[];
  separator?: boolean;
  spacing?: Spacing;
}

export interface Column {
  type: "Column";
  width: string;
  items: CardElement[];
  separator?: boolean;
  spacing?: Spacing;
}

export interface OpenUrlAction {
  type: "Action.OpenUrl";
  url: string;
  title?: string;
}

export interface CardAction {
  type: string;
  title?: string;
  url?: string;
}

export type Spacing = "None" | "Small" | "Default" | "Medium" | "Large" | "ExtraLarge" | "Padding";

export type CardElement =
  | TextBlock
  | Image
  | Container
  | FactSet
  | ColumnSet
  | Column;
