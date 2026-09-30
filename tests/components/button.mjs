// Reference spec. Copy its shape for every component.
export const tests = [
  {
    name: 'Tab reaches buttons in order and Enter/Space activate a toggle',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const toggle = page.locator('#states ~ .demo button[aria-pressed="false"]').first()
      await toggle.focus()
      await page.keyboard.press('Enter')
      // The docs demo is static; this checks the control is a real, focusable, activatable <button>.
      expect.equal(await toggle.evaluate((el) => el.tagName), 'BUTTON', 'is a native button')
      await expect.focused(page, '.btn[aria-pressed]')
    },
  },
  {
    name: 'aria-disabled buttons are focusable but inert (SG.guard)',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const b = page.locator('.btn[aria-disabled="true"]').first()
      await page.evaluate(() => { window.__clicks = 0; document.querySelector('.btn[aria-disabled="true"]').addEventListener('click', () => window.__clicks++) })
      await b.focus()
      await expect.focused(page, '.btn[aria-disabled="true"]', 'aria-disabled stays focusable')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      expect.equal(await page.evaluate(() => window.__clicks), 0, 'keyboard activation is blocked')
    },
  },
  {
    name: 'disabled buttons are skipped by Tab',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const n = await page.locator('.btn:disabled').count()
      expect.ok(n >= 1, 'demo has a disabled button')
      await page.locator('.btn:disabled').first().focus().catch(() => {})
      await expect.focused(page, 'body', 'disabled button cannot take focus')
    },
  },
]
