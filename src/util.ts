export function afterDOMContentLoaded(callback: () => void): void {
  if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    // `DOMContentLoaded` has already fired
    callback();
  }
}

export function throttle<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    if (performance.now() - lastCall >= delay) {
      callback(...args);
      lastCall = performance.now();
    }
  }) as any;
}
