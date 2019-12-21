import { AsyncIterableX } from './asynciterablex';

export class OnErrorResumeNextAsyncIterable<TSource> extends AsyncIterableX<TSource> {
  private _source: Iterable<AsyncIterable<TSource>>;

  constructor(source: Iterable<AsyncIterable<TSource>>) {
    super();
    this._source = source;
  }

  async *[Symbol.asyncIterator]() {
    for (let item of this._source) {
      let it = item[Symbol.asyncIterator]();
      while (1) {
        let next;
        try {
          next = await it.next();
        } catch (e) {
          break;
        }

        if (next.done) {
          break;
        }
        yield next.value;
      }
    }
  }
}

export function onErrorResumeNext<T>(...args: AsyncIterable<T>[]): AsyncIterableX<T> {
  return new OnErrorResumeNextAsyncIterable<T>(args);
}