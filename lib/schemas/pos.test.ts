import { describe, expect, it } from 'vitest'
import { cronAuthorization, posConnectInput, posResumeInput, posLocationInput, posMappingInput, posWebhookTarget, testPosEvent } from './pos'

const dish = '6f1c2b1e-8f7a-4c3e-9a1b-2d3e4f5a6b7c'
const other = '7a2d3c4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e'

describe('the POS schemas', () => {
  it('takes a provider key and a trimmed API key of at least 8 characters', () => {
    expect(posConnectInput.parse({ provider: 'test-pos', apiKey: '  test_demo  ' })).toEqual({ provider: 'test-pos', apiKey: 'test_demo' })
    expect(posConnectInput.safeParse({ provider: 'test-pos', apiKey: 'short' }).success).toBe(false)
    expect(posConnectInput.safeParse({ provider: 'Test POS', apiKey: 'test_demo_key' }).success).toBe(false)
  })

  it('takes a location id, never an empty one', () => {
    expect(posLocationInput.parse({ locationId: 'tpos-terrace' })).toEqual({ locationId: 'tpos-terrace' })
    expect(posLocationInput.safeParse({ locationId: '  ' }).success).toBe(false)
  })

  it('takes matches with an item or null, and refuses a dish listed twice or an id that is not a uuid', () => {
    expect(posMappingInput.parse({ items: [{ dishId: dish, externalItemId: 'i-1' }, { dishId: other, externalItemId: null }] }).items).toHaveLength(2)
    expect(posMappingInput.safeParse({ items: [{ dishId: dish, externalItemId: 'i-1' }, { dishId: dish, externalItemId: null }] }).success).toBe(false)
    expect(posMappingInput.safeParse({ items: [{ dishId: 'd1', externalItemId: 'i-1' }] }).success).toBe(false)
  })

  it('resumes by sending or discarding what waited, nothing else', () => {
    expect(posResumeInput.parse({ waiting: 'discard' })).toEqual({ waiting: 'discard' })
    expect(posResumeInput.safeParse({ waiting: 'keep' }).success).toBe(false)
  })

  it('reads a webhook address as a provider and a connection uuid', () => {
    expect(posWebhookTarget.parse({ provider: 'test-pos', connection: dish })).toEqual({ provider: 'test-pos', connection: dish })
    expect(posWebhookTarget.safeParse({ provider: 'test-pos', connection: null }).success).toBe(false)
  })

  it('reads a bearer header as its token, and nothing else', () => {
    expect(cronAuthorization.parse('Bearer s3cret-value')).toBe('s3cret-value')
    expect(cronAuthorization.safeParse('Basic abc').success).toBe(false)
    expect(cronAuthorization.safeParse('Bearer ').success).toBe(false)
  })

  it('reads a Test POS event of one of its four kinds', () => {
    expect(testPosEvent.parse({ id: 'e', type: 'MENU_CHANGED', location: 'l' })).toEqual({ id: 'e', type: 'MENU_CHANGED', location: 'l' })
    expect(testPosEvent.safeParse({ id: 'e', type: 'REFUND', location: 'l' }).success).toBe(false)
  })
})
