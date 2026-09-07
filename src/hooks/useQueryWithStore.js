import { useQuery } from '@tanstack/react-query';

export function useQueryWithStore({ queryKey, queryFn, enabled = true, onSuccess, onError, placeholderData }) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    placeholderData,
    onSuccess,
    onError,
  });
}
// A closure is a JavaScript feature where an inner function remembers
//  variables from its outer lexical scope even after the outer function 
//  has completed execution. This happens because the function keeps 
//  a reference to its lexical environment. Closures are commonly used
//   for data privacy, counters, event handlers, memoization, and are 
//   heavily used internally in React Hooks. One thing to be careful 
//   about is that closures can increase memory
//  usage if they unnecessarily retain references to large objects.*/