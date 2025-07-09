
/** A simple mutex lock that:
* - Knows whether it's locked
* - Has a lock method that locks it if it's not already locked, and let's us know if we were the one who locked it.
* - Automatically unlocks after a specified duration.
*/
export class TimeBasedMutexLock {
  #isLocked = false;
  #lockedAt = 0;
  constructor(readonly lockDuration = 200) {
  }
  get isLocked() {
    return this.#isLocked;
  }
  lock() {
    if(Date.now() - this.#lockedAt > this.lockDuration) {
      this.#isLocked = false;
    }
    if (!this.#isLocked) {
      this.#isLocked = true;
      this.#lockedAt = Date.now();
      return true;
    } else {
      return false;
    }
  }
}

