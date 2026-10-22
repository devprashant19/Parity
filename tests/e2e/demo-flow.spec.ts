import { test, expect } from '@playwright/test';

test.describe('60-Second Sample Demo Flow (End-to-End)', () => {
  test('executes clean sample, inspects evidence, records decision, exports CSV, and switches to messy packet', async ({
    page,
  }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Parity/i);

    // 2. Load clean sample
    const loadCleanBtn = page.getByRole('button', { name: /Load sample scholarship packet/i });
    await expect(loadCleanBtn).toBeVisible();
    await loadCleanBtn.click();

    // Verify sample documents populated
    await expect(page.locator('text=application-form-suresh.pdf')).toBeVisible();

    // 3. Run check
    const runCheckBtn = page.getByRole('button', { name: /Run check/i });
    await expect(runCheckBtn).toBeEnabled();
    await runCheckBtn.click();

    // 4. Verify Animated Counters (3 Conflicts, 2 Consistent, 0 Needs Review)
    const conflictsCard = page.getByTestId('counter-conflicts');
    const consistentCard = page.getByTestId('counter-consistent');
    const needsReviewCard = page.getByTestId('counter-needs-review');

    await expect(conflictsCard.locator('.text-3xl')).toHaveText('3');
    await expect(consistentCard.locator('.text-3xl')).toHaveText('2');
    await expect(needsReviewCard.locator('.text-3xl')).toHaveText('0');

    // Verify persistent Sample Result label is visible
    await expect(page.getByText(/Sample Result/i).first()).toBeVisible();

    // 5. Open Evidence Drawer for Marks Percentage
    const marksRow = page.locator('text=Marks Percentage').first();
    await marksRow.click();

    const drawer = page.locator('aside');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('text=Marks Percentage')).toBeVisible();

    // Verify side-by-side evidence quotes
    await expect(drawer.getByText('92.4%').first()).toBeVisible();
    await expect(drawer.getByText('89.4%').first()).toBeVisible();

    // 6. Record decision: Marksheet is authoritative
    const marksheetChoiceBtn = drawer.getByRole('button', { name: /Marksheet is correct/i });
    await expect(marksheetChoiceBtn).toBeVisible();
    await marksheetChoiceBtn.click();

    // Close drawer with Escape
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();

    // 7. Verify Fix List updated with authoritative resolution
    await expect(page.locator('text=Update the application form to 89.4%')).toBeVisible();

    // 8. Test CSV Export trigger
    const exportCsvBtn = page.getByRole('button', { name: /Export CSV/i });
    await expect(exportCsvBtn).toBeVisible();

    // 9. Switch to Messy Packet without refreshing
    const loadMessyBtn = page.getByRole('button', { name: /Try a messy packet/i });
    await loadMessyBtn.click();

    const rerunBtn = page.getByRole('button', { name: /Run check|Re-run check/i });
    await rerunBtn.click();

    // 10. Verify Messy Packet results show Needs Review
    await expect(needsReviewCard.locator('.text-3xl')).toHaveText('1');
    await expect(page.getByText(/Possible match/i).first()).toBeVisible();

    // 11. Test Reset
    const resetBtn = page.getByRole('button', { name: /Reset/i });
    await resetBtn.click();
    await expect(page.getByRole('button', { name: /Run check/i })).toBeDisabled();
  });
});
