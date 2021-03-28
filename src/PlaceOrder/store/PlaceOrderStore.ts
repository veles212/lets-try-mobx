import Decimal from "decimal.js";
import { observable, computed, action } from "mobx";

import { OrderSide, Target, ComputedTarget, TargetErrors } from "../model";

export class PlaceOrderStore {
  @observable activeOrderSide: OrderSide = "buy";
  @observable price: number = 0;
  @observable amount: number = 0;
  @observable isTakeProfit = false;
  @observable targets: Target[] = [];
  @observable targetErrors: TargetErrors[] | null = null;

  @computed get total(): number {
    return this.price * this.amount;
  }

  @computed get computedTargets(): ComputedTarget[] {
    return this.targets.map((target) => {
      const { profit } = target;
      const profitDirection = this.activeOrderSide === "buy" ? profit : -profit;
      const price = new Decimal(profitDirection)
        .div(100)
        .plus(1)
        .mul(this.price)
        .toNumber();
      return { ...target, price };
    });
  }

  @computed get projectedProfit(): string {
    return this.computedTargets
      .reduce((acc, { price, amount }) => {
        const percent = new Decimal(amount).div(100);
        const targetPrice =
          this.activeOrderSide === "buy"
            ? new Decimal(price).minus(this.price).mul(percent)
            : new Decimal(this.price).minus(price).mul(percent);
        return acc.add(targetPrice);
      }, new Decimal(0))
      .mul(this.amount)
      .toFixed(2);
  }

  @action.bound
  public setOrderSide(side: OrderSide) {
    this.activeOrderSide = side;
  }

  @action.bound
  public setPrice(price: number) {
    this.price = price;
  }

  @action.bound
  public setAmount(amount: number) {
    this.amount = amount;
  }

  @action.bound
  public setTotal(total: number) {
    this.amount = this.price > 0 ? total / this.price : 0;
  }

  @action.bound
  public setTakeProfit(isChecked: boolean) {
    this.isTakeProfit = isChecked;
    if (isChecked) {
      this.addProfit();
    } else {
      this.targets = [];
    }
  }

  @action.bound
  public addProfit() {
    if (this.targets.length >= 5) {
      return;
    }
    const lastProfit = this.targets.length
      ? this.targets[this.targets.length - 1].profit
      : 0;
    const profit = lastProfit + 2;
    const newProfit = {
      profit,
      amount: this.targets.length < 1 ? 100 : 20,
      errors: {}
    };
    this.targets = [...this.targets, newProfit];

    this.updateAmount();
    this.clearTargetErrors();
  }

  @action.bound
  public removeProfit(index: number) {
    this.targets = this.targets.filter((_, arrayIndex) => index !== arrayIndex);

    if (this.targets.length < 1) {
      this.isTakeProfit = false;
    }
  }

  @action.bound
  public setTargetProfit(index: number, profit: number) {
    this.targets = this.targets.map((target, arrayIndex) => {
      if (index === arrayIndex) {
        return { ...target, profit };
      }
      return target;
    });

    this.clearTargetErrors();
  }

  @action.bound
  public setTargetPrice(index: number, price: number) {
    this.targets = this.targets.map((target, arrayIndex) => {
      if (index === arrayIndex) {
        const profit = new Decimal(price)
          .div(this.price)
          .minus(1)
          .mul(100)
          .toNumber();
        return { ...target, profit };
      }
      return target;
    });

    this.clearTargetErrors();
  }

  @action.bound
  public setTargetAmount(index: number, amount: number) {
    this.targets = this.targets.map((target, arrayIndex) => {
      if (index === arrayIndex) {
        return { ...target, amount };
      }
      return target;
    });

    this.clearTargetErrors();
  }

  @action.bound
  public validateTargets() {
    const { profitSum, amountSum } = this.targets.reduce<{
      profitSum: number;
      amountSum: number;
    }>(
      (acc, { profit, amount }) => ({
        profitSum: acc.profitSum + profit,
        amountSum: acc.amountSum + amount
      }),
      { profitSum: 0, amountSum: 0 }
    );

    this.targetErrors = this.targets.map((target, index, array) => ({
      ...(amountSum > 100 && {
        amount: `${amountSum} out of 100% selected. Please decrease by ${
          amountSum - 100
        }`
      }),
      ...(index > 0 &&
        target.profit < array[index - 1].profit && {
          profit: "Each target's profit should be greater than the previous one"
        }),
      ...(target.profit <= -100 && {
        price: "Price must be greater than 0"
      }),
      ...(target.profit < 0.01 && { profit: "Minimum value is 0.01" }),
      ...(profitSum > 500 && { profit: "Maximum profit sum is 500%" })
    }));
  }

  private updateAmount() {
    const { sum, maxIndex } = this.targets.reduce<{
      sum: number;
      maxValue: number;
      maxIndex: number;
    }>(
      (acc, { amount }, index) => ({
        ...acc,
        sum: acc.sum + amount,
        ...(amount > acc.maxValue && { maxValue: amount, maxIndex: index })
      }),
      {
        sum: 0,
        maxValue: 0,
        maxIndex: 0
      }
    );
    if (sum > 100) {
      this.targets = this.targets.map((target, index) => {
        if (index === maxIndex) {
          return { ...target, amount: target.amount - (sum - 100) };
        }
        return target;
      });
    }
  }

  private clearTargetErrors() {
    this.targetErrors = null;
  }
}
