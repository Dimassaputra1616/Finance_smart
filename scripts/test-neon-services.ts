import { db } from "../src/lib/db";
import { uploadToNeonStorage, readFromNeonStorage } from "../src/lib/neon-storage";
import { getNeonServices } from "../src/lib/neon";

async function runTests() {
  console.log("=== PENGUJIAN LAYANAN NEON END-TO-END ===\n");
  const services = getNeonServices();
  let allPassed = true;

  // 1. Uji Database PostgreSQL (Neon)
  console.log("1. Menguji Database Neon PostgreSQL...");
  try {
    const userCount = await db.user.count();
    console.log(`   ✅ Database Terhubung! Total user: ${userCount}`);
  } catch (err: unknown) {
    allPassed = false;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`   ❌ Database Gagal: ${msg}`);
  }

  // 2. Uji Neon Auth (JWKS Endpoint)
  console.log("\n2. Menguji Neon Auth (JWKS Endpoint)...");
  if (services.auth.jwksUrl) {
    try {
      const res = await fetch(services.auth.jwksUrl);
      if (res.ok) {
        const data = await res.json();
        console.log(`   ✅ Neon Auth Terhubung! HTTP ${res.status}, Keys:`, data.keys?.length ?? 0);
      } else {
        allPassed = false;
        console.error(`   ❌ Neon Auth HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: unknown) {
      allPassed = false;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Neon Auth Gagal: ${msg}`);
    }
  } else {
    console.log("   ⚠️ NEON_AUTH_JWKS_URL tidak disetel.");
  }

  // 3. Uji Neon Functions (Hello World)
  console.log("\n3. Menguji Neon Function (Hello)...");
  if (services.functions.helloUrl) {
    try {
      const res = await fetch(services.functions.helloUrl);
      const text = await res.text();
      if (res.ok) {
        console.log(`   ✅ Neon Function Berhasil! Status: ${res.status}, Response: "${text.trim()}"`);
      } else {
        allPassed = false;
        console.error(`   ❌ Neon Function HTTP ${res.status}: ${text}`);
      }
    } catch (err: unknown) {
      allPassed = false;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Neon Function Gagal: ${msg}`);
    }
  } else {
    console.log("   ⚠️ NEON_FUNCTION_HELLO_BASE_URL tidak disetel.");
  }

  // 4. Uji Neon Object Storage (Bucket assets)
  console.log("\n4. Menguji Neon Object Storage (Bucket assets)...");
  if (services.storage.configured) {
    try {
      const testKey = `test/ping_${Date.now()}.txt`;
      const testContent = "Halo dari Keuangan App via Neon Object Storage S3!";
      const uploadOk = await uploadToNeonStorage(testKey, Buffer.from(testContent), "text/plain");

      if (uploadOk) {
        console.log(`   ✅ Upload ke bucket assets berhasil: ${testKey}`);
        const readBuffer = await readFromNeonStorage(testKey);
        if (readBuffer && readBuffer.toString("utf-8") === testContent) {
          console.log(`   ✅ Read-back dari bucket assets berhasil & cocok: "${readBuffer.toString()}"`);
        } else {
          allPassed = false;
          console.error("   ❌ Read-back data tidak cocok.");
        }
      } else {
        allPassed = false;
        console.error("   ❌ Upload ke Neon Object Storage gagal.");
      }
    } catch (err: unknown) {
      allPassed = false;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Neon Object Storage Gagal: ${msg}`);
    }
  } else {
    console.log("   ⚠️ Object Storage tidak terkonfigurasi.");
  }

  // 5. Uji Realtime Config
  console.log("\n5. Menguji Konfigurasi Neon Realtime...");
  if (services.realtime.configured) {
    console.log(`   ✅ Neon Realtime Terkonfigurasi: ${services.realtime.url}`);
  } else {
    console.log("   ⚠️ Realtime tidak terkonfigurasi.");
  }

  console.log("\n=========================================");
  if (allPassed) {
    console.log("🎉 SEMUA LAYANAN NEON BERHASIL TERHUBUNG & BERFUNGSI SEMPURNA!");
  } else {
    console.log("⚠️ ADA BEBERAPA LAYANAN YANG GAGAL / PERLU PENYESUAIAN.");
  }

  await db.$disconnect();
}

runTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
