import { Component, type ReactNode, type ErrorInfo } from 'react'
import { getClient, captureException } from '../index'

interface NzrErrorBoundaryProps {
  /** Fallback UI to render when an error is caught. */
  fallback: ReactNode | ((error: Error) => ReactNode)
  /** Called when an error is caught, after reporting to NZR. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  children: ReactNode
}

interface NzrErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary that automatically captures errors and sends them
 * to NZR Autofix.
 *
 * @example
 * ```tsx
 * import { NzrErrorBoundary } from '@nzr/autofix/react'
 *
 * <NzrErrorBoundary fallback={<h1>Something went wrong</h1>}>
 *   <App />
 * </NzrErrorBoundary>
 * ```
 */
export class NzrErrorBoundary extends Component<
  NzrErrorBoundaryProps,
  NzrErrorBoundaryState
> {
  constructor(props: NzrErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): NzrErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Send to NZR Autofix
    captureException(error, {
      componentStack: errorInfo.componentStack ?? '',
    })

    // Call user's onError handler
    this.props.onError?.(error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props
      if (typeof fallback === 'function') {
        return fallback(this.state.error)
      }
      return fallback
    }
    return this.props.children
  }
}

/**
 * Hook to access the NZR Autofix client in React components.
 *
 * @example
 * ```tsx
 * import { useNzrAutofix } from '@nzr/autofix/react'
 *
 * function MyComponent() {
 *   const { captureException, addBreadcrumb } = useNzrAutofix()
 *
 *   const handleClick = () => {
 *     addBreadcrumb({ category: 'ui', message: 'Button clicked', level: 'info' })
 *     try {
 *       riskyAction()
 *     } catch (e) {
 *       captureException(e as Error)
 *     }
 *   }
 * }
 * ```
 */
export function useNzrAutofix() {
  const client = getClient()

  return {
    captureException: (error: Error, extra?: Record<string, unknown>) =>
      client?.captureException(error, extra) ?? null,
    captureMessage: (
      message: string,
      level?: 'error' | 'warning' | 'info',
      extra?: Record<string, unknown>,
    ) => client?.captureMessage(message, level, extra) ?? null,
    addBreadcrumb: (
      breadcrumb: Omit<import('../types').Breadcrumb, 'timestamp'>,
    ) => client?.addBreadcrumb(breadcrumb),
  }
}
