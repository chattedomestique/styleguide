// tests/components/shell.mjs: the docs shell's own skip link, mobile menu and reduced-motion token.
export const tests = [
  {
    name: 'skip link is the first Tab stop and moves focus to <main>',
    async run({ page, goto, expect }) {
      await goto('index.html')
      await page.keyboard.press('Tab')
      await expect.focused(page, '.skip-link', 'first Tab stop')
      await page.keyboard.press('Enter')
      await expect.focused(page, 'main#main', 'focus lands in main')
    },
  },
  {
    name: 'menu button toggles aria-expanded; Escape closes and returns focus',
    viewport: { width: 390, height: 844 }, // the drawer only exists below 64em
    async run({ page, goto, expect }) {
      await goto('index.html')
      await expect.attr(page, '.docs-bar__menu', 'aria-expanded', 'false')
      await page.locator('.docs-bar__menu').focus()
      await page.keyboard.press('Enter')
      await expect.attr(page, '.docs-bar__menu', 'aria-expanded', 'true')
      await expect.focused(page, '#docs-nav a', 'focus moves into the drawer')
      await page.keyboard.press('Escape')
      await expect.attr(page, '.docs-bar__menu', 'aria-expanded', 'false')
      await expect.focused(page, '.docs-bar__menu', 'focus returns to the trigger')
    },
  },
  {
    name: 'reduced motion turns travel off (--move is 0)',
    reducedMotion: true, // emulates prefers-reduced-motion: reduce
    async run({ page, goto, expect }) {
      await goto('index.html')
      const move = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--move').trim())
      expect.equal(move, '0', '--move under reduced motion')
    },
  },
]
