import { AsyncIterableX } from '../asynciterablex';
import { OperatorAsyncFunction } from '../../interfaces';

export class ScanAsyncIterable<T, R> extends AsyncIterableX<R> {
  private _source: AsyncIterable<T>;
  private _fn: (acc: R, x: T, index: number) => R | Promise<R>;
  private _seed?: T | R;
  private _hasSeed: boolean;

  constructor(
    source: AsyncIterable<T>,
    fn: (acc: R, x: T, index: number) => R | Promise<R>,
    seed: R[]
  ) {
    super();
    this._source = source;
    this._fn = fn;
    this._hasSeed = seed.length === 1;
    this._seed = seed[0];
  }

  async *[Symbol.asyncIterator]() {
    let i = 0,
      hasValue = false,
      acc = this._seed;
    for await (let item of this._source) {
      if (hasValue || (hasValue = this._hasSeed)) {
        acc = await this._fn(<R>acc, item, i++);
        yield acc;
      } else {
        acc = item;
        hasValue = true;
        i++;
      }
    }
    if (i === 1 && !this._hasSeed) {
      yield acc as R;
    }
  }
}

export function scan<T, R = T>(
  accumulator: (previousValue: R, currentValue: T, currentIndex: number) => R | Promise<R>,
  seed?: never[]
): OperatorAsyncFunction<T, R>;
export function scan<T, R = T>(
  accumulator: (previousValue: R, currentValue: T, currentIndex: number) => R | Promise<R>,
  seed?: R
): OperatorAsyncFunction<T, R>;
export function scan<T, R = T>(
  accumulator: (previousValue: R, currentValue: T, currentIndex: number) => R | Promise<R>,
  ...seed: R[]
): OperatorAsyncFunction<T, R> {
  return function scanOperatorFunction(source: AsyncIterable<T>): AsyncIterableX<R> {
    return new ScanAsyncIterable(source, accumulator, seed);
  };
}
