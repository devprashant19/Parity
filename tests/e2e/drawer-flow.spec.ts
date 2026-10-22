import { test, expect } from '@playwright/test';

test.describe('Evidence Drawer & Student Decision Flow', () => {
  test('opens drawer, records student decision, updates fix list, and tests manual override', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 1. Load clean sample packet
    const loadSampleBtn = page.getByRole('button', { name: /Load sample scholarship packet/i });
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // 2. Run check
    const runCheckBtn = page.getByRole('button', { name: /Run check/i });
    await expect(runCheckBtn).toBeVisible();
    await runCheckBtn.click();

    // 3. Verify counters
    await expect(page.locator('text=Conflicts').first()).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible();
    await expect(page.locator('text=2').first()).toBeVisible();

    // 4. Inspect checklist and click Marks Percentage
    const marksRow = page.locator('text=Marks Percentage').first();
    await expect(marksRow).toBeVisible();
    await marksRow.click();

    // 5. Drawer opens
    const drawer = page.locator('aside');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('text=Marks Percentage')).toBeVisible();

    // Verify quotes
    await expect(drawer.locator('text=92.4%').first()).toBeVisible();
    await expect(drawer.locator('text=89.4%').first()).toBeVisible();

    // 6. Click "Marksheet is correct"
    const marksheetCorrectBtn = drawer.getByRole('button', { name: /Marksheet is correct/i });
    await expect(marksheetCorrectBtn).toBeVisible();
    await marksheetCorrectBtn.click();

    // 7. Verify Fix list updates
    await expect(page.getByRole('heading', { name: 'Update the application form to 89.4%' })).toBeVisible();

    // 8. Test Manual Entry
    const manualBtn = drawer.getByRole('button', { name: /Enter value manually/i });
    await expect(manualBtn).toBeVisible();
    await manualBtn.click();

    const manualInput = drawer.locator('input[placeholder*="89.4%"]');
    await expect(manualInput).toBeVisible();
    await manualInput.fill('92.4%');

    const saveManualBtn = drawer.getByRole('button', { name: /Save & Re-evaluate/i });
    await saveManualBtn.click();
  });
});
