import { describe, it, expect } from 'vitest'
import { parseStackTrace } from '../src/stack-parser'

describe('parseStackTrace', () => {
  it('returns empty array for empty input', () => {
    expect(parseStackTrace('')).toEqual([])
  })

  it('parses Chrome/V8 stack trace', () => {
    const stack = `Error: test error
    at doSomething (http://localhost:3000/src/app.js:42:13)
    at handleClick (http://localhost:3000/src/components/Button.js:15:5)
    at HTMLButtonElement.dispatch (http://localhost:3000/node_modules/react-dom.js:3456:16)`

    const frames = parseStackTrace(stack)

    expect(frames).toHaveLength(3)
    expect(frames[0]).toEqual({
      function: 'doSomething',
      filename: 'app.js',
      absPath: 'http://localhost:3000/src/app.js',
      lineno: 42,
      colno: 13,
    })
    expect(frames[1].function).toBe('handleClick')
    expect(frames[1].filename).toBe('Button.js')
  })

  it('parses Firefox stack trace', () => {
    const stack = `doSomething@http://localhost:3000/src/app.js:42:13
handleClick@http://localhost:3000/src/components/Button.js:15:5
@http://localhost:3000/src/index.js:1:1`

    const frames = parseStackTrace(stack)

    expect(frames).toHaveLength(3)
    expect(frames[0]).toEqual({
      function: 'doSomething',
      filename: 'app.js',
      absPath: 'http://localhost:3000/src/app.js',
      lineno: 42,
      colno: 13,
    })
    expect(frames[2].function).toBe('<anonymous>')
  })

  it('handles anonymous Chrome frames', () => {
    const stack = `Error: oops
    at http://localhost:3000/bundle.js:100:20`

    const frames = parseStackTrace(stack)

    expect(frames).toHaveLength(1)
    expect(frames[0].function).toBe('<anonymous>')
    expect(frames[0].lineno).toBe(100)
  })
})
