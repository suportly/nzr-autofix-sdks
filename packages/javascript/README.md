# NZR Autofix JavaScript/TypeScript SDK

Capture frontend errors and send them to NZR Manager for AI-powered diagnosis and auto-fix.

## Installation

```bash
npm install @nzr/autofix
```

## Quick Start

```typescript
import { init, captureException } from '@nzr/autofix'

init({
  dsn: 'https://your-server.com/api/autofix/ingest/',
  environment: 'production',
  release: '1.0.0',
})

// Unhandled errors and promise rejections are captured automatically
```

## React Integration

```tsx
import { NzrErrorBoundary, useNzrAutofix } from '@nzr/autofix/react'

// Wrap your app with the error boundary
function App() {
  return (
    <NzrErrorBoundary fallback={<h1>Something went wrong</h1>}>
      <MyApp />
    </NzrErrorBoundary>
  )
}

// Use the hook for manual capture
function MyComponent() {
  const { captureException, addBreadcrumb } = useNzrAutofix()

  const handleClick = () => {
    addBreadcrumb({ category: 'ui', message: 'Button clicked', level: 'info' })
    try {
      riskyAction()
    } catch (e) {
      captureException(e as Error)
    }
  }
}
```

## Angular Integration

```typescript
import { NzrErrorHandler } from '@nzr/autofix/angular'

@NgModule({
  providers: [{ provide: ErrorHandler, useClass: NzrErrorHandler }]
})
export class AppModule {}
```

## Manual Capture

```typescript
import { captureException, captureMessage, addBreadcrumb } from '@nzr/autofix'

// Capture errors
try {
  riskyOperation()
} catch (e) {
  captureException(e as Error, { userId: '123' })
}

// Capture messages
captureMessage('Something unexpected', 'warning')

// Track user actions
addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to /settings',
  level: 'info',
})
```

## Configuration

```typescript
init({
  dsn: 'https://your-server.com/api/autofix/ingest/',
  environment: 'production',
  release: '1.0.0',
  sampleRate: 1.0,           // 0.0 to 1.0
  maxBreadcrumbs: 50,
  maxQueueSize: 100,
  flushIntervalMs: 5000,
  sendTimeoutMs: 5000,
  enableGlobalHandlers: true, // window.onerror + onunhandledrejection
  sanitizePatterns: ['password', 'token', 'secret'],
  beforeSend: (event) => {
    // Return null to drop the event
    return event
  },
})
```

## Features

- Zero dependencies
- Automatic global error capture (onerror + unhandledrejection)
- React ErrorBoundary component
- Angular ErrorHandler
- Breadcrumb tracking
- Sensitive data scrubbing
- Reliable delivery via sendBeacon on page unload
- Sample rate control
- beforeSend hook for event filtering
- ESM + CJS builds with full TypeScript types

## License

MIT
