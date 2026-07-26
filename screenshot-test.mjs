import puppeteer from 'puppeteer'
import { writeFileSync } from 'node:fs'

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

async function screenshot(url, file) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  page.on('console', msg => console.log(`[${file}] ${msg.type()}: ${msg.text()}`))
  page.on('pageerror', err => console.log(`[${file}] PAGE ERROR: ${err.message}`))
  page.on('requestfailed', req => console.log(`[${file}] REQ FAILED: ${req.url()}`))

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))
  await page.screenshot({ path: file, fullPage: true })
  console.log(`Saved ${file}`)
  const title = await page.title()
  const content = await page.evaluate(() => document.body.innerText.slice(0, 500))
  console.log(`Title: ${title}`)
  console.log(`Content: ${content}`)
  await page.close()
}

try {
  await screenshot('http://localhost:5173/', 'home.png')
  await screenshot('http://localhost:5173/auth', 'auth.png')
  await screenshot('http://localhost:5173/chat', 'chat.png')
}
catch (e) {
  console.error('Error:', e.message)
}
finally {
  await browser.close()
}
