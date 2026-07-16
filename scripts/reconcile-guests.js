/*
 * reconcile-guests.js
 * ---------------------------------------------------------------------------
 * Finds guests who RSVP'd (got a confirmation email) but are missing from the
 * NocoDB Guests table — e.g. rows deleted during test cleanup — and, with
 * --apply, re-inserts them. When a token is known it is written back to the
 * Token/QRCode fields so the guest's original emailed QR code still scans at
 * the door.
 *
 * SOURCE OF TRUTH (who actually RSVP'd), in priority order:
 *   1. n8n executions API   — set N8N_API_URL and N8N_API_KEY in .env
 *   2. CSV file             — pass --csv <path>
 *      CSV columns (header row required, case-insensitive):
 *        name,email,phone,attending,guestCount,token
 *      token is optional; attending defaults to true.
 *
 * USAGE:
 *   node scripts/reconcile-guests.js                 # dry-run, n8n source
 *   node scripts/reconcile-guests.js --csv rsvps.csv # dry-run, CSV source
 *   node scripts/reconcile-guests.js --csv rsvps.csv --apply   # write missing rows
 *
 * Dry-run by default. Nothing is written to NocoDB unless --apply is passed.
 * Matching is by normalized phone (primary) then lowercased email, so the
 * script is idempotent — re-running never creates duplicates.
 * ---------------------------------------------------------------------------
 */

'use strict'

const fs = require('fs')
const path = require('path')

// ── Minimal .env loader (no dependency) ────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnv()

// ── Config ─────────────────────────────────────────────────────────────────
const NOCODB_GUESTS_URL =
  (process.env.NOCODB_URL
    ? `${process.env.NOCODB_URL.replace(/\/$/, '')}/api/v1/db/data/v1/Guests/Guests`
    : 'https://nocodb-production-54ae.up.railway.app/api/v1/db/data/v1/Guests/Guests')
const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN
const N8N_API_URL = process.env.N8N_API_URL // e.g. https://n8n-production-4aeb1.up.railway.app
const N8N_API_KEY = process.env.N8N_API_KEY
const N8N_RSVP_WORKFLOW_ID = process.env.N8N_RSVP_WORKFLOW_ID || 'GbR7sL4feWTsb1Eo'

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const csvIdx = args.indexOf('--csv')
const CSV_PATH = csvIdx !== -1 ? args[csvIdx + 1] : null

// ── Helpers ──────────────────────────────────────────────────────────────
function normalisePhone(raw) {
  if (!raw) return ''
  let v = String(raw).replace(/[\s\-+]/g, '')
  if (v.startsWith('0')) v = '254' + v.slice(1)
  return v.replace(/\D/g, '')
}

function normaliseEmail(raw) {
  return raw ? String(raw).trim().toLowerCase() : ''
}

function toBool(v) {
  if (typeof v === 'boolean') return v
  const s = String(v).trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes' || s === 'y'
}

// ── Source 1: n8n executions ───────────────────────────────────────────────
async function fetchFromN8n() {
  if (!N8N_API_URL || !N8N_API_KEY) return null
  const base = N8N_API_URL.replace(/\/$/, '')
  const rsvps = []
  let cursor = null
  let page = 0
  do {
    const url = new URL(`${base}/api/v1/executions`)
    url.searchParams.set('workflowId', N8N_RSVP_WORKFLOW_ID)
    url.searchParams.set('status', 'success')
    url.searchParams.set('includeData', 'true')
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url.toString(), {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY, accept: 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`n8n API error ${res.status}: ${await res.text()}`)
    }
    const body = await res.json()
    for (const exec of body.data || []) {
      const rec = extractFromExecution(exec)
      if (rec) rsvps.push(rec)
    }
    cursor = body.nextCursor || null
    page++
  } while (cursor && page < 100)
  return rsvps
}

// Dig the webhook payload + generated token out of one execution's runData.
function extractFromExecution(exec) {
  try {
    const runData = exec.data && exec.data.resultData && exec.data.resultData.runData
    if (!runData) return null
    const webhookJson =
      runData['RSVP Webhook'] &&
      runData['RSVP Webhook'][0].data.main[0][0].json
    const body = webhookJson && (webhookJson.body || webhookJson)
    if (!body || !body.email) return null

    let token = ''
    const qrNode = runData['QRCodeGenerator']
    if (qrNode) {
      const j = qrNode[0].data.main[0][0].json
      token = j.token || j.Token || ''
    }
    return {
      name: body.name || '',
      email: body.email || '',
      phone: body.phone || '',
      attending: body.attending !== undefined ? toBool(body.attending) : true,
      guestCount: body.guestCount != null ? body.guestCount : 1,
      token,
    }
  } catch {
    return null
  }
}

// ── Source 2: CSV ──────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = []
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return rows
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const rec = {}
    headers.forEach((h, idx) => (rec[h] = cols[idx] != null ? cols[idx].trim() : ''))
    rows.push({
      name: rec.name || '',
      email: rec.email || '',
      phone: rec.phone || '',
      attending: rec.attending !== undefined && rec.attending !== '' ? toBool(rec.attending) : true,
      guestCount: rec.guestcount || rec.guest_count || 1,
      token: rec.token || '',
    })
  }
  return rows
}

// Handles quoted fields containing commas.
function splitCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

// ── NocoDB ─────────────────────────────────────────────────────────────────
async function fetchNocoGuests() {
  const url = new URL(NOCODB_GUESTS_URL)
  url.searchParams.set('limit', '1000')
  const res = await fetch(url.toString(), {
    headers: { 'xc-token': NOCODB_TOKEN },
  })
  if (!res.ok) throw new Error(`NocoDB GET ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.list || []
}

async function insertGuest(rec) {
  const body = {
    Name: rec.name,
    Email: rec.email,
    Phone: normalisePhone(rec.phone),
    Attending: rec.attending,
    GuestCount: rec.guestCount,
  }
  if (rec.token) {
    body.Token = rec.token
    body.QRCode = rec.token
  }
  const res = await fetch(NOCODB_GUESTS_URL, {
    method: 'POST',
    headers: { 'xc-token': NOCODB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`NocoDB POST ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!NOCODB_TOKEN) {
    console.error('✗ NOCODB_API_TOKEN is not set (checked .env). Aborting.')
    process.exit(1)
  }

  // 1. Load the source list of everyone who RSVP'd.
  let source = null
  if (CSV_PATH) {
    const p = path.resolve(process.cwd(), CSV_PATH)
    if (!fs.existsSync(p)) {
      console.error(`✗ CSV not found: ${p}`)
      process.exit(1)
    }
    source = parseCsv(fs.readFileSync(p, 'utf8'))
    console.log(`Source: CSV (${CSV_PATH}) → ${source.length} RSVP records`)
  } else {
    source = await fetchFromN8n()
    if (source == null) {
      console.error(
        '✗ No source. Set N8N_API_URL + N8N_API_KEY in .env, or pass --csv <path>.'
      )
      process.exit(1)
    }
    console.log(`Source: n8n executions → ${source.length} RSVP records`)
  }

  // 2. Dedupe source by phone|email, preferring records that carry a token.
  const byKey = new Map()
  for (const rec of source) {
    const key = normalisePhone(rec.phone) || normaliseEmail(rec.email)
    if (!key) continue
    const existing = byKey.get(key)
    if (!existing || (!existing.token && rec.token)) byKey.set(key, rec)
  }
  const uniqueSource = [...byKey.values()]

  // 3. Fetch current NocoDB guests, index by phone and email.
  const nocoGuests = await fetchNocoGuests()
  const nocoPhones = new Set()
  const nocoEmails = new Set()
  for (const g of nocoGuests) {
    const ph = normalisePhone(g.Phone || g.phone)
    const em = normaliseEmail(g.Email || g.email)
    if (ph) nocoPhones.add(ph)
    if (em) nocoEmails.add(em)
  }
  console.log(`NocoDB currently has ${nocoGuests.length} guest rows.\n`)

  // 4. Diff.
  const missing = uniqueSource.filter((rec) => {
    const ph = normalisePhone(rec.phone)
    const em = normaliseEmail(rec.email)
    const inDb = (ph && nocoPhones.has(ph)) || (em && nocoEmails.has(em))
    return !inDb
  })

  if (missing.length === 0) {
    console.log('✓ No missing guests — NocoDB matches the RSVP source. Nothing to do.')
    return
  }

  console.log(`Found ${missing.length} RSVP(s) missing from NocoDB:\n`)
  for (const m of missing) {
    console.log(
      `  • ${m.name || '(no name)'} | ${m.email} | ${normalisePhone(m.phone) || '(no phone)'} | token: ${m.token ? 'yes' : 'MISSING'}`
    )
  }
  console.log('')

  if (!APPLY) {
    console.log('Dry-run. Re-run with --apply to insert these rows into NocoDB.')
    const noToken = missing.filter((m) => !m.token).length
    if (noToken > 0) {
      console.log(
        `Note: ${noToken} record(s) have no token — they will be inserted with a blank QR ` +
          '(check in by name at the door, or re-send them a QR email).'
      )
    }
    return
  }

  // 5. Apply.
  console.log('Applying — inserting missing rows...\n')
  let ok = 0
  let fail = 0
  for (const m of missing) {
    try {
      const created = await insertGuest(m)
      ok++
      console.log(`  ✓ inserted ${m.name || m.email} (Id ${created.Id ?? '?'})`)
    } catch (e) {
      fail++
      console.error(`  ✗ failed ${m.name || m.email}: ${e.message}`)
    }
  }
  console.log(`\nDone. Inserted ${ok}, failed ${fail}.`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
