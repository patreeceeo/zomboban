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

export function throttle<TArgs extends any[], TReturn extends any>(
  callback: ThrottleInputFunction<TArgs, TReturn>,
  delay: number,
): ThrottleOutputFunction<TArgs, TReturn> {
  let lastCall = 0;
  let isLeading = true;
  let timeout: NodeJS.Timeout | undefined;
  const throttled = (...args: TArgs) => {
    const now = performance.now();
    let returnValue: TReturn | undefined = undefined;
    if (isLeading) {
      returnValue = callback(...args);
      lastCall = now;
      isLeading = false;
    } else if (now - lastCall >= delay) {
      returnValue = callback(...args);
      lastCall = now;
    }
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(reset, 10);
    return returnValue;
  };

  return throttled;

  function reset() {
    isLeading = true;
  }
}
