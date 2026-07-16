import { ref, watchEffect, type Ref } from 'vue'
import { liveQuery } from 'dexie'

/**
 * A reusable composable that wraps Dexie's liveQuery into a Vue ref.
 *
 * The `queryFn` is wrapped in `watchEffect`, so it automatically re-subscribes
 * whenever any Vue reactive dependency (e.g. computed, ref) used inside it changes.
 *
 * @example
 * ```ts
 * const transactions = useLiveQuery(() =>
 *   db.transactions.orderBy('id').reverse().toArray()
 * )
 * ```
 */
export function useLiveQuery<T>(queryFn: () => Promise<T>, initialValue: T): Ref<T> {
  const result = ref<T>(initialValue) as Ref<T>

  watchEffect((onCleanup) => {
    const observable = liveQuery(queryFn)
    const sub = observable.subscribe({
      next: (data: T) => {
        result.value = data
      },
    })
    onCleanup(() => sub.unsubscribe())
  })

  return result
}