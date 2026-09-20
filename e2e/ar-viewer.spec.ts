import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'

// The AR viewer page mounts four hooks (the model-viewer script, the auto-hiding controls,
// fullscreen, AR support) and unmounts them on navigation; a page error in either direction is
// the regression a static render cannot see.
test.describe('AR viewer', () => {
  test('without a model it explains itself and passes the accessibility scan', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/ar-viewer')
    await expect(page.getByRole('heading', { name: 'No Model Specified' })).toBeVisible()
    await expectNoSeriousA11yViolations(page)
    expect(errors).toEqual([])
  })

  test('with a model it mounts the viewer chrome and unmounts it on navigation without a page error', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/ar-viewer?model=/ar/chicken.glb&name=Grilled%20Chicken')
    await expect(page.getByRole('heading', { name: /Grilled Chicken|Loading AR Experience|Error Loading AR/ })).toBeVisible()
    await page.goto('/offline')
    await expect(page).toHaveURL(/\/offline$/)
    expect(errors).toEqual([])
  })
})
