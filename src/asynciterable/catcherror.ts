import { AsyncIterableX } from './asynciterablex';
import { returnAsyncIterator } from '../util/returniterator';

export class CatchAllAsyncIterable<TSource> extends AsyncIterableX<TSource> {
  private _source: Iterable<AsyncIterable<TSource>>;

  constructor(source: Iterable<AsyncIterable<TSource>>) {
    super();
    this._source = source;
  }

  async *[Symbol.asyncIterator]() {
    let error = null,
      hasError = false;

    for (let source of this._source) {
      const it = source[Symbol.asyncIterator]();

      error = null;
      hasError = false;

      while (1) {
        let c = <TSource>{};

        try {
          const { done, value } = await it.next();
          if (done) {
            await returnAsyncIterator(it);
            break;
          }
          c = value;
        } catch (e) {
          error = e;
          hasError = true;
          await returnAsyncIterator(it);
          break;
        }

        yield c;
      }

      if (!hasError) {
        break;
      }
    }

    if (hasError) {
      throw error;
    }
  }
}

/**
 * Creates a sequence by concatenating source sequences until a source sequence completes successfully.
 * @param {AsyncIterable<AsyncIterable<T>>} source Source sequences.
 * @return {AsyncIterable<T>} Sequence that continues to concatenate source sequences while errors occur.
 */
export function catchAll<T>(source: Iterable<AsyncIterable<T>>): AsyncIterableX<T> {
  return new CatchAllAsyncIterable<T>(source);
}

export function catchError<T>(...args: AsyncIterable<T>[]): AsyncIterableX<T> {
  return new CatchAllAsyncIterable<T>(args);
}
