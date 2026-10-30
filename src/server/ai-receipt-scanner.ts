import "server-only";
import fs from "fs";
import path from "path";
import { getActiveAccounts, getActiveCategories } from "@/server/queries/finance";
import { getBrandConfig } from "@/server/brand-storage";

export interface ReceiptScanResult {
  ok: boolean;
  amount?: number;
  date?: string; // YYYY-MM-DD
  description?: string;
  categoryId?: string | null;
  accountId?: string | null;
  confidence?: number;
  message?: string;
}

/**
 * Membaca variabel lingkungan langsung dari berkas .env di disk bila proses server
 * belum sempat di-restart setelah pengubahan file konfigurasi.
 */
function readLiveEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = new RegExp(`^\\s*${key}\\s*=\\s*["']?([^"'\\r\\n]+)["']?`, "m").exec(content);
      if (match) return match[1].trim();
    }
  } catch {}
  return undefined;
}

/**
 * Ekstraksi data nota/struk belanja menggunakan Anthropic Claude Vision API.
 */
export async function scanReceiptWithClaude(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<ReceiptScanResult> {
  // Ambil API key dari konfigurasi database atau .env
  const brandConfig = await getBrandConfig();
  const apiKey =
    brandConfig.anthropicApiKey ||
    readLiveEnv("ANTHROPIC_API_KEY") ||
    readLiveEnv("AI_API_KEY");

  if (!apiKey) {
    return {
      ok: false,
      message:
        "Kunci API belum dikonfigurasi. Masukkan kunci API di menu Config Master (tab Integrasi AI) atau file .env.",
    };
  }

  // Base URL resolution (prioritaskan setting kustom .env / 9router)
  const envBaseUrl = readLiveEnv("AI_BASE_URL");
  const rawBase =
    (brandConfig.aiBaseUrl && brandConfig.aiBaseUrl !== "https://api.anthropic.com"
      ? brandConfig.aiBaseUrl
      : undefined) ||
    envBaseUrl ||
    brandConfig.aiBaseUrl ||
    "https://api.anthropic.com";

  const cleanBase = rawBase
    .replace(/\/+$/, "")
    .replace(/\/v1\/messages$/, "")
    .replace(/\/v1$/, "");
  const targetUrl = `${cleanBase}/v1/messages`;

  // Model name resolution
  const envModelName = readLiveEnv("AI_MODEL_NAME");
  const modelName =
    (brandConfig.aiModelName && brandConfig.aiModelName !== "claude-3-5-haiku-20241022"
      ? brandConfig.aiModelName
      : undefined) ||
    envModelName ||
    brandConfig.aiModelName ||
    "claude-3-5-haiku-20241022";

  // Ambil daftar pos anggaran dan rekening kas aktif agar AI bisa mencocokkan keduanya
  const [categories, accounts] = await Promise.all([
    getActiveCategories(),
    getActiveAccounts(),
  ]);

  const categoryContext = categories
    .map((c) => `- ID: "${c.id}" | Nama: "${c.name}" | Jenis: ${c.kind}`)
    .join("\n");

  const accountContext = accounts
    .map((a) => `- ID: "${a.id}" | Nama: "${a.name}" | Tipe: ${a.type}`)
    .join("\n");

  // Normalisasi media type yang diterima Claude Vision
  let mediaType = "image/jpeg";
  if (mimeType.includes("png")) mediaType = "image/png";
  else if (mimeType.includes("webp")) mediaType = "image/webp";
  else if (mimeType.includes("gif")) mediaType = "image/gif";

  const base64Image = imageBuffer.toString("base64");

  const systemPrompt = `Kamu adalah asisten akuntansi cerdas untuk perbendaharaan kas dan pembukuan internal di Indonesia.
Tugasmu adalah menganalisis foto bukti nota, kuitansi, struk belanja, tiket, faktur, atau bukti transfer kas, lalu mengekstrak informasi penting secara akurat.

Pemeriksaan Validitas Gambar:
Pertama, periksa apakah gambar yang diunggah benar-benar merupakan dokumen transaksi keuangan (struk kasir minimarket, nota toko, kuitansi, faktur/invoice belanja, tiket transportasi, atau bukti transfer bank).
- Jika BUKAN dokumen transaksi (misalnya foto selfie, wajah orang, foto makanan tanpa struk, pemandangan, meme, screenshot chat biasa, atau benda acak), beri nilai "isReceipt": false dan jelaskan di "message".
- Jika BENAR dokumen transaksi, beri nilai "isReceipt": true dan lakukan ekstraksi data.

Aturan Ekstraksi (hanya jika isReceipt: true):
1. amount: Cari total pembayaran akhir / grand total / jumlah uang yang harus dibayar (bukan subtotal atau tarif pajak saja). Kembalikan sebagai angka integer bulat positif tanpa titik, tanpa koma, dan tanpa simbol rupiah (contoh: 145000). Jika tidak ditemukan atau tidak yakin, kembalikan 0.
2. date: Cari tanggal transaksi yang tertera pada nota dalam format YYYY-MM-DD. Jika tahun tidak tertera jelas, gunakan tahun berjalan 2026. Jika tanggal tidak ada sama sekali, gunakan tanggal hari ini (${new Date().toISOString().split("T")[0]}).
3. description: Buat ringkasan keperluan belanja dan nama toko/merchant yang ringkas, jelas, dan profesional untuk buku kas kantor (maksimal 60 karakter). Contoh: "Makan Siang Tim di RM Padang Sederhana", "Bensin Pertamax SPBU Kuningan", "Belanja ATK Kantor Gramedia".
4. categoryId: Pilih salah satu ID kategori yang paling cocok dari daftar kategori yang disediakan di bawah ini. Jika tidak ada yang cocok, gunakan null.
5. accountId: Periksa metode pembayaran di struk (apakah Tunai/Cash, Debit BCA, Mandiri, Transfer, QRIS, Kartu Kredit). Cocokkan dengan daftar rekening bank & kas yang disediakan di bawah ini. Jika tidak tertera atau ragu, gunakan null.
6. confidence: Nilai estimasi kejelasan teks nota antara 0.1 sampai 1.0.

PENTING:
Wajib balas HANYA berupa objek JSON murni tanpa pembuka/penutup markdown (\`\`\`json), tanpa penjelasan atau teks tambahan di luar JSON.

Format JSON jika BUKAN struk/nota transaksi:
{
  "isReceipt": false,
  "message": "Foto terdeteksi bukan bukti nota, kuitansi, atau dokumen transaksi keuangan."
}

Format JSON jika BENAR struk/nota transaksi:
{
  "isReceipt": true,
  "amount": 145000,
  "date": "2026-10-29",
  "description": "Bensin Pertamax SPBU Kuningan",
  "categoryId": "id_kategori_disini",
  "accountId": "id_akun_disini",
  "confidence": 0.95
}`;

  const promptText = `Daftar Kategori yang tersedia di sistem:
${categoryContext || "Tidak ada kategori terdaftar"}

Daftar Rekening Bank & Kas yang tersedia di sistem:
${accountContext || "Tidak ada rekening terdaftar"}

Silakan baca foto struk/nota ini dan berikan hasil JSON sesuai instruksi.`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 1000,
        temperature: 0.1,
        stream: false,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: promptText,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      let errorMsg = `Gagal memproses gambar (${response.status}).`;
      try {
        const parsedErr = JSON.parse(errBody);
        if (parsedErr?.error?.message) {
          errorMsg = `API (${cleanBase}): ${parsedErr.error.message}`;
        } else if (parsedErr?.message) {
          errorMsg = `API (${cleanBase}): ${parsedErr.message}`;
        }
      } catch {
        if (errBody) errorMsg = `API (${cleanBase}): ${errBody.slice(0, 150)}`;
      }
      return { ok: false, message: errorMsg };
    }

    const responseText = await response.text();

    let rawContent: string | undefined;

    // 1. Coba parse sebagai objek JSON biasa
    try {
      const resJson = JSON.parse(responseText);
      rawContent =
        resJson?.content?.[0]?.text ??
        resJson?.choices?.[0]?.message?.content ??
        resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch {
      // 2. Jika bukan JSON murni, kemungkinan gateway mengirim stream SSE (Server-Sent Events)
      if (responseText.includes("data:")) {
        const lines = responseText.split("\n");
        let accumulatedText = "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const deltaJson = JSON.parse(dataStr);
              // Format Anthropic SSE
              if (deltaJson?.delta?.text) {
                accumulatedText += deltaJson.delta.text;
              }
              // Format OpenAI SSE
              else if (deltaJson?.choices?.[0]?.delta?.content) {
                accumulatedText += deltaJson.choices[0].delta.content;
              }
              // Format Anthropic message / content block
              else if (deltaJson?.content_block?.text) {
                accumulatedText += deltaJson.content_block.text;
              }
            } catch {}
          }
        }

        if (accumulatedText) {
          rawContent = accumulatedText;
        }
      }
    }

    if (!rawContent) {
      return {
        ok: false,
        message: `AI tidak mengembalikan teks respons yang valid. Cuplikan: ${responseText.slice(0, 100)}`,
      };
    }

    // Bersihkan pembungkus markdown jika ada
    let cleanedJson = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Jika model mengeluarkan teks pengantar, ambil objek JSON di dalam kurung kurawal {...}
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedJson = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedJson);

    // Jika AI mendeteksi bahwa gambar BUKAN struk/nota transaksi
    if (parsed.isReceipt === false) {
      return {
        ok: false,
        message:
          parsed.message ||
          "Foto tidak terdeteksi sebagai bukti nota, kuitansi, atau dokumen transaksi keuangan.",
      };
    }

    // Normalisasi amount: bisa number atau string ("145000", "Rp 145.000")
    let finalAmount = 0;
    if (typeof parsed.amount === "number") {
      finalAmount = Math.abs(Math.round(parsed.amount));
    } else if (typeof parsed.amount === "string") {
      const parsedNum = parseInt(parsed.amount.replace(/\D/g, ""), 10);
      if (!isNaN(parsedNum)) finalAmount = parsedNum;
    }

    return {
      ok: true,
      amount: finalAmount,
      date: typeof parsed.date === "string" ? parsed.date : undefined,
      description: typeof parsed.description === "string" ? parsed.description : undefined,
      categoryId: typeof parsed.categoryId === "string" ? parsed.categoryId : null,
      accountId: typeof parsed.accountId === "string" ? parsed.accountId : null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Terjadi kendala saat membaca nota: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
