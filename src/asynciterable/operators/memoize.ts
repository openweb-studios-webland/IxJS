import { AsyncIterableX } from '../asynciterablex';
import { IRefCountList, MaxRefCountList, RefCountList } from '../../iterable/operators/_refcountlist';
import { create } from '../create';
import { OperatorAsyncFunction } from '../../interfaces';

export class MemoizeAsyncBuffer<T> extends AsyncIterableX<T> {
  private _source: AsyncIterator<T>;
  private _buffer: IRefCountList<T>;
  private _error: any;
  private _stopped: boolean = false;

  constructor(source: AsyncIterator<T>, buffer: IRefCountList<T>) {
    super();
    this._source = source;
    this._buffer = buffer;
  }

  async *[Symbol.asyncIterator]() {
    let i = 0;
    try {
      while (1) {
        let hasValue = false,
          current = <T>{};
        if (i >= this._buffer.count) {
          if (!this._stopped) {
            try {
              let next = await this._source.next();
              hasValue = !next.done;
              if (hasValue) {
                current = next.value;
              }
            } catch (e) {
              this._error = e;
              this._stopped = true;
            }
          }

          if (this._stopped) {
            throw this._error;
          }

          if (hasValue) {
            this._buffer.push(current);
          }
        } else {
          hasValue = true;
        }

        if (hasValue) {
          yield this._buffer.get(i);
        } else {
          break;
        }

        i++;
      }
    } finally {
      this._buffer.done();
    }
  }
}

export function memoize<TSource>(readerCount?: number): OperatorAsyncFunction<TSource, TSource>;
export function memoize<TSource, TResult>(
  readerCount?: number,
  selector?: (value: AsyncIterable<TSource>) => AsyncIterable<TResult>
): OperatorAsyncFunction<TSource, TResult>;
export function memoize<TSource, TResult = TSource>(
  readerCount: number = -1,
  selector?: (value: AsyncIterable<TSource>) => AsyncIterable<TResult>
): OperatorAsyncFunction<TSource, TSource | TResult> {
  return function memoizeOperatorFunction(
    source: AsyncIterable<TSource>
  ): AsyncIterableX<TSource | TResult> {
    if (!selector) {
      return readerCount === -1
        ? new MemoizeAsyncBuffer<TSource>(
            source[Symbol.asyncIterator](),
            new MaxRefCountList<TSource>()
          )
        : new MemoizeAsyncBuffer<TSource>(
            source[Symbol.asyncIterator](),
            new RefCountList<TSource>(readerCount)
          );
    }
    return create<TSource | TResult>(() =>
      selector!((memoize<TSource>(readerCount))(source))[Symbol.asyncIterator]()
    );
  };
}
