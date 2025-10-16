'use client'

import { useMemo, useRef, useCallback } from 'react'

// Generic memoization hook with custom equality function
export function useMemoWithComparison<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: any, b: any) => boolean
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>()

  const defaultIsEqual = (a: any, b: any) => {
    if (a.length !== b.length) return false
    return a.every((item: any, index: number) => Object.is(item, b[index]))
  }

  const compareFunction = isEqual || defaultIsEqual

  if (!ref.current || !compareFunction(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() }
  }

  return ref.current.value
}

// Deep comparison memoization for complex objects
export function useMemoDeep<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemoWithComparison(
    factory,
    deps,
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  )
}

// Memoization for expensive calculations with cache size limit
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  cacheSize: number = 10
): T {
  const cache = useRef<Map<string, T>>(new Map())
  
  return useMemo(() => {
    const key = JSON.stringify(deps)
    
    if (cache.current.has(key)) {
      return cache.current.get(key)!
    }
    
    const result = factory()
    
    // Implement LRU cache
    if (cache.current.size >= cacheSize) {
      const firstKey = cache.current.keys().next().value
      cache.current.delete(firstKey)
    }
    
    cache.current.set(key, result)
    return result
  }, deps)
}

// Debounced memoization for frequently changing values
export function useDebouncedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const valueRef = useRef<T>()
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      valueRef.current = factory()
      setTrigger(prev => prev + 1)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, deps)

  return valueRef.current || factory()
}

// Memoized callback with stable reference
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<T>()
  
  useMemo(() => {
    ref.current = callback
  }, deps)
  
  return useCallback((...args: any[]) => {
    return ref.current?.(...args)
  }, []) as T
}

// Memoization for async operations
export function useAsyncMemo<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList,
  initialValue: T
): { value: T; loading: boolean; error: Error | null } {
  const [state, setState] = useState<{
    value: T
    loading: boolean
    error: Error | null
  }>({
    value: initialValue,
    loading: false,
    error: null
  })

  useEffect(() => {
    let cancelled = false
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    factory()
      .then(result => {
        if (!cancelled) {
          setState({ value: result, loading: false, error: null })
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState(prev => ({ ...prev, loading: false, error }))
        }
      })
    
    return () => {
      cancelled = true
    }
  }, deps)

  return state
}

// Memoization for component props to prevent unnecessary re-renders
export function useMemoizedProps<T extends Record<string, any>>(props: T): T {
  return useMemoDeep(() => props, Object.values(props))
}

// Selective memoization - only memoize if computation is expensive
export function useSelectiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  shouldMemoize: boolean = true
): T {
  const directResult = factory()
  const memoizedResult = useMemo(factory, deps)
  
  return shouldMemoize ? memoizedResult : directResult
}

// Memoization with performance tracking
export function usePerformanceMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  name?: string
): T {
  return useMemo(() => {
    const start = performance.now()
    const result = factory()
    const end = performance.now()
    
    if (name && end - start > 10) { // Log if computation takes more than 10ms
      console.log(`Expensive computation "${name}" took ${(end - start).toFixed(2)}ms`)
    }
    
    return result
  }, deps)
}

// Import useState and useEffect for the debounced memo
import { useState, useEffect } from 'react'