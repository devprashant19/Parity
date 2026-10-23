import { test, expect } from '@playwright/test';

test.describe('Evidence Drawer & Student Decision Flow', () => {
  test('opens drawer, records student decision, updates fix list, and tests manual override', async ({ page }) => {
    await page.goto('/');

    // 1. Load clean sample packet
    const loadSampleBtn = page.getByRole('button', { name: /Load sample clean packet|Load sample scholarship packet/i });
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // 2. Run check
    const runCheckBtn = page.getByTestId('run-verification-check-btn');
    await expect(runCheckBtn).toBeVisible();
    await runCheckBtn.click();

    // 3. Verify counters
    await expect(page.locator('text=Conflicts').first()).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible();
    await expect(page.locator('text=2').first()).toBeVisible();

    // 4. Inspect checklist and click Academic Performance / GPA
    const marksRow = page.getByTestId('field-row-marks');
    await expect(marksRow).toBeVisible();
    await marksRow.click();

    // 5. Drawer opens
    const drawer = page.locator('aside');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('text=Academic Performance / GPA')).toBeVisible();

    // Verify quotes
    await expect(drawer.locator('text=3.80 GPA').first()).toBeVisible();
    await expect(drawer.locator('text=3.50 GPA').first()).toBeVisible();

    // 6. Click "Academic Transcript is correct"
    const marksheetCorrectBtn = drawer.getByRole('button', { name: /Academic Transcript is correct/i });
    await expect(marksheetCorrectBtn).toBeVisible();
    await marksheetCorrectBtn.click();

    // 7. Verify Fix list updates
    await expect(page.getByRole('heading', { name: 'Update the application form to 3.50 GPA' })).toBeVisible();

    // 8. Test Manual Entry
    const manualBtn = drawer.getByRole('button', { name: /Enter value manually/i });
    await expect(manualBtn).toBeVisible();
    await manualBtn.click();

    const manualInput = drawer.getByTestId('manual-value-input');
    await expect(manualInput).toBeVisible();
    await manualInput.fill('3.80 GPA');

    const saveManualBtn = drawer.getByTestId('manual-save-btn');
    await saveManualBtn.click();
  });
});
