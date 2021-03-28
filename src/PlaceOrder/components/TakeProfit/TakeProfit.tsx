/* eslint @typescript-eslint/no-use-before-define: 0 */

import React from "react";
import block from "bem-cn-lite";
import { AddCircle, Cancel } from "@material-ui/icons";
import { observer } from "mobx-react";

import { Switch, TextButton, NumberInput } from "components";

import { QUOTE_CURRENCY } from "../../constants";
import { ComputedTarget } from "PlaceOrder/model";
import { useStore } from "PlaceOrder/context";
import "./TakeProfit.scss";

const b = block("take-profit");

const TakeProfit = observer(() => {
  const {
    activeOrderSide,
    isTakeProfit,
    setTakeProfit,
    computedTargets,
    targetErrors,
    projectedProfit,
    addProfit,
    removeProfit,
    setTargetProfit,
    setTargetPrice,
    setTargetAmount
  } = useStore();

  return (
    <div className={b()}>
      <div className={b("switch")}>
        <span>Take profit</span>
        <Switch checked={isTakeProfit} onChange={setTakeProfit} />
      </div>
      {isTakeProfit && (
        <div className={b("content")}>
          {renderTitles()}
          {computedTargets.map((target, index) => renderInputs(index, target))}
          {computedTargets.length < 5 && (
            <TextButton className={b("add-button")} onClick={addProfit}>
              <AddCircle className={b("add-icon")} />
              <span>Add profit target {computedTargets.length}/5</span>
            </TextButton>
          )}
          <div className={b("projected-profit")}>
            <span className={b("projected-profit-title")}>
              Projected profit
            </span>
            <span className={b("projected-profit-value")}>
              <span>{projectedProfit}</span>
              <span className={b("projected-profit-currency")}>
                {QUOTE_CURRENCY}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  function renderInputs(index: number, target: ComputedTarget) {
    const { profit, price, amount } = target;
    const errors = targetErrors?.[index] ?? {};
    return (
      <div className={b("inputs")} key={index}>
        <NumberInput
          value={profit}
          decimalScale={2}
          InputProps={{ endAdornment: "%" }}
          variant="underlined"
          onBlur={(value) => setTargetProfit(index, Number(value))}
          error={errors["profit"]}
        />
        <NumberInput
          value={price}
          decimalScale={2}
          InputProps={{ endAdornment: QUOTE_CURRENCY }}
          variant="underlined"
          onBlur={(value) => setTargetPrice(index, Number(value))}
          error={errors["price"]}
        />
        <NumberInput
          value={amount}
          decimalScale={2}
          InputProps={{ endAdornment: "%" }}
          variant="underlined"
          onBlur={(value) => setTargetAmount(index, Number(value))}
          error={errors["amount"]}
        />
        <div className={b("cancel-icon")}>
          <Cancel onClick={() => removeProfit(index)} />
        </div>
      </div>
    );
  }

  function renderTitles() {
    return (
      <div className={b("titles")}>
        <span>Profit</span>
        <span>Trade price</span>
        <span>Amount to {activeOrderSide === "buy" ? "sell" : "buy"}</span>
      </div>
    );
  }
});

export { TakeProfit };
