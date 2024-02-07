/**
 * To optimize perf for finding the next unused entity id, it will help to have a data structure that
 * represents which entity ids have and have not been used as spans of ids.
 */
class Span {
  start: number;
  end: number;
  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
}

export class SpanSet {
  #spans: Span[] = [];
  #mergeOverlappingSpans() {
    for (let i = 0; i < this.#spans.length - 1; i++) {
      const current = this.#spans[i];
      const next = this.#spans[i + 1];
      if (current.end >= next.start) {
        current.end = Math.max(current.end, next.end);
        this.#spans.splice(i + 1, 1);
        i--;
      }
    }
  }

  get nextAvailableIndex(): number {
    let next = 0;
    for (const span of this.#spans) {
      if (next < span.start) {
        return next;
      }
      next = span.end + 1;
    }
    return next;
  }
  get spanCount(): number {
    return this.#spans.length;
  }

  add(start: number, end = start) {
    let index = 0;
    while (index < this.#spans.length && this.#spans[index].start < start) {
      index++;
    }
    const lastSpan = this.#spans.at(-1);
    if (
      index > 0 &&
      index === this.#spans.length - 1 &&
      lastSpan!.end === start
    ) {
      // extend the last span, which is the most likely case
      lastSpan!.end = end;
    } else {
      this.#spans.splice(index, 0, new Span(start, end));

      this.#mergeOverlappingSpans();
    }
  }
  delete(start: number, end = start) {
    for (const [index, span] of this.#spans.entries()) {
      if (span.end >= start && span.start <= end) {
        if (span.start <= start) {
          // cut off the end of the span
          span.end = start - 1;
        }
        if (span.end >= end) {
          // cut off the beginning of the span
          span.start = end + 1;
        }
        if (span.start <= span.end) {
          // the span was completely removed
          this.#spans.splice(index, 1);
        }
      }
    }
  }
  has(index: number): boolean {
    for (const span of this.#spans) {
      if (span.start <= index && index <= span.end) {
        return true;
      }
    }
    return false;
  }

  indexes(): Iterable<number> {
    let spanIndex = 0;
    let index = 0;
    return {
      [Symbol.iterator]: () => {
        return {
          next: () => {
            if (spanIndex < this.#spans.length) {
              const result = { value: index, done: false };
              index++;
              if (index > this.#spans[spanIndex].end) {
                spanIndex++;
                index = this.#spans[spanIndex]?.start;
              }
              return result;
            } else {
              return { value: index, done: true };
            }
          },
        };
      },
    };
  }
}
