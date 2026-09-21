import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** Fails the test on any serious or critical axe violation on the current page state (A11Y.1); `where` names the page in the failure. */
export async function expectNoSeriousA11yViolations(page: Page, where = page.url()) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const summary = `${where}\n` + blocking.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`).join('\n')
  expect(blocking, summary).toEqual([])
}
