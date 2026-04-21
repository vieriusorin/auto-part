import { describe, expect, it } from 'vitest'
import { getGarageEmptyMessage, getTimelineEmptyMessage } from './screen-messages'

describe('mobile screen fallback states', () => {
  it('returns the expected garage empty-state text', () => {
    expect(getGarageEmptyMessage()).toBe('No vehicles yet.')
  })

  it('returns the expected timeline fallback text', () => {
    expect(getTimelineEmptyMessage()).toBe('No entries yet.')
  })
})
