export type OrderSide = "buy" | "sell";

export interface Target {
  profit: number;
  amount: number;
}

export interface ComputedTarget extends Target {
  price: number;
}

export interface TargetErrors {
  profit?: string;
  price?: string;
  amount?: string;
}
