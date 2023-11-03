import { throttle as _throttle } from "lodash";

export function afterDOMContentLoaded(callback: () => void): void {
  if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    // `DOMContentLoaded` has already fired
    callback();
  }
}


interface ThrottleInputFunction<TArgs extends any[], TReturn extends any> {
  (...args: TArgs): TReturn;
}
interface ThrottleOutputFunction<TArgs extends any[], TReturn extends any> {
  (...args: TArgs): TReturn | undefined;
}

const throttleOptions = {
  leading: true,
  trailing: false,
};
export function throttle<TArgs extends any[], TReturn extends any>(
  callback: ThrottleInputFunction<TArgs, TReturn>,
  delay: number,
): ThrottleOutputFunction<TArgs, TReturn> {
  return _throttle(callback, delay, throttleOptions);
}

