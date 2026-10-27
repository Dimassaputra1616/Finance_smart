import { chromium } from "playwright";
import fs from "fs";

async function main() {
  // Kredensial dibaca dari environment, tidak ditulis di kode.
  const username = process.env.AUDIT_USER;
  const password = process.env.AUDIT_PASS;

  if (!username || !password) {
    console.error(
      "AUDIT_USER dan AUDIT_PASS wajib diisi. Contoh:\n" +
        "  AUDIT_USER=admin AUDIT_PASS=... npx tsx scripts/audit-dark-mode.ts",
    );
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  console.log("Navigating to http://127.0.0.1:3000...");
  try {
    // 1. Login first to bypass auth
    await page.goto("http://127.0.0.1:3000/login", { waitUntil: "networkidle" });
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 2. Go to dashboard
    await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // 3. Capture light mode
    fs.mkdirSync("screenshots", { recursive: true });
    await page.screenshot({ path: "screenshots/dashboard-light.png" });
    console.log("Captured screenshots/dashboard-light.png");

    // 4. Toggle dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    });
    await page.waitForTimeout(500);

    // 5. Inspect computed styles of sidebar and body
    const styles = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const body = document.body;
      const html = document.documentElement;
      const activeLink = document.querySelector("aside a[aria-current='page']");

      return {
        htmlClasses: html.className,
        bodyBg: body ? getComputedStyle(body).backgroundColor : null,
        bodyColor: body ? getComputedStyle(body).color : null,
        asideBg: aside ? getComputedStyle(aside).backgroundColor : null,
        asideColor: aside ? getComputedStyle(aside).color : null,
        asideBorder: aside ? getComputedStyle(aside).borderRightColor : null,
        activeLinkBg: activeLink ? getComputedStyle(activeLink).backgroundColor : null,
        activeLinkColor: activeLink ? getComputedStyle(activeLink).color : null,
      };
    });

    console.log("COMPUTED STYLES IN DARK MODE:", JSON.stringify(styles, null, 2));

    // 6. Capture dark mode
    await page.screenshot({ path: "screenshots/dashboard-dark.png" });
    console.log("Captured screenshots/dashboard-dark.png");
  } catch (err) {
    console.error("Error during audit:", err);
  } finally {
    await browser.close();
  }
}

main();
