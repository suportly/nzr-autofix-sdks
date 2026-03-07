/**
 * Angular integration for NZR Autofix.
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { NgModule, ErrorHandler } from '@angular/core'
 * import { NzrErrorHandler } from '@nzr/autofix/angular'
 *
 * @NgModule({
 *   providers: [
 *     { provide: ErrorHandler, useClass: NzrErrorHandler }
 *   ]
 * })
 * export class AppModule {}
 * ```
 */

import { getClient } from '../index'

/**
 * Angular ErrorHandler that captures errors and sends to NZR Autofix.
 *
 * Implements Angular's ErrorHandler interface without requiring
 * @angular/core as a direct dependency.
 */
export class NzrErrorHandler {
  handleError(error: unknown): void {
    const client = getClient()

    if (error instanceof Error) {
      client?.captureException(error)
    } else {
      client?.captureMessage(
        error?.toString?.() ?? 'Unknown Angular error',
        'error',
      )
    }

    // Also log to console so Angular's default behavior is preserved
    console.error(error)
  }
}

/**
 * Factory function to create an Angular ErrorHandler provider.
 *
 * @example
 * ```typescript
 * import { provideNzrErrorHandler } from '@nzr/autofix/angular'
 *
 * // In standalone app:
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNzrErrorHandler()]
 * })
 * ```
 */
export function provideNzrErrorHandler() {
  return {
    provide: 'ErrorHandler',
    useClass: NzrErrorHandler,
  }
}
