# NZR Autofix SDKs

Official SDKs for [NZR Autofix](https://nzr.com) — AI-powered error diagnosis and auto-fix.

Capture errors in your application and send them to NZR Manager, which uses AI to diagnose root causes, generate code fixes, and create hotfix pull requests automatically.

## SDKs

| Package | Language | Install |
|---------|----------|---------|
| [nzr-autofix](packages/python/) | Python 3.9+ | `pip install nzr-autofix` |
| [@nzr/autofix](packages/javascript/) | TypeScript/JavaScript | `npm install @nzr/autofix` |

## Quick Start

### Python

```python
import nzr_autofix

nzr_autofix.init(dsn="https://your-server.com/api/autofix/ingest/")

# Errors are captured automatically via sys.excepthook
# Or capture manually:
try:
    risky_operation()
except Exception as e:
    nzr_autofix.capture_exception(e)
```

**Django middleware:**
```python
# settings.py
MIDDLEWARE = [
    'nzr_autofix.integrations.django.AutofixMiddleware',
    # ...
]
```

### JavaScript / TypeScript

```typescript
import { init } from '@nzr/autofix'

init({ dsn: 'https://your-server.com/api/autofix/ingest/' })

// Unhandled errors are captured automatically
// Or capture manually:
try {
  riskyOperation()
} catch (e) {
  captureException(e as Error)
}
```

**React:**
```tsx
import { NzrErrorBoundary } from '@nzr/autofix/react'

<NzrErrorBoundary fallback={<h1>Something went wrong</h1>}>
  <App />
</NzrErrorBoundary>
```

**Angular:**
```typescript
import { NzrErrorHandler } from '@nzr/autofix/angular'

@NgModule({
  providers: [{ provide: ErrorHandler, useClass: NzrErrorHandler }]
})
export class AppModule {}
```

## License

MIT
