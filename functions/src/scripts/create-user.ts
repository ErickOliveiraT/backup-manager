/**
 * Creates a user in Firestore.
 *
 * Usage:
 *   npm run create-user -- --name "Erick" --username erick --password secret
 *
 * Requires SERVICE_ACCOUNT_KEY in .env pointing to a Firebase service account JSON.
 * Download it from: Firebase Console → Project Settings → Service Accounts → Generate new private key
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

const keyPath = process.env.SERVICE_ACCOUNT_KEY
if (!keyPath) {
  console.error('Error: SERVICE_ACCOUNT_KEY is not set in .env')
  console.error('Set it to the path of your Firebase service account JSON file.')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(resolve(keyPath), 'utf-8'))

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) })
}

const db = getFirestore()
const usersCol = db.collection('users')

function parseArgs(): { name: string; username: string; password: string } {
  const args = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : undefined
  }
  const name = get('--name')
  const username = get('--username')
  const password = get('--password')
  if (!name || !username || !password) {
    console.error('Usage: npm run create-user -- --name "<name>" --username <username> --password <password>')
    process.exit(1)
  }
  return { name, username, password }
}

async function main() {
  const { name, username, password } = parseArgs()

  const existing = await usersCol.where('username', '==', username).limit(1).get()
  if (!existing.empty) {
    console.error(`Error: username "${username}" already exists.`)
    process.exit(1)
  }

  const password_hash = await bcrypt.hash(password, 12)
  const api_key = uuidv4()
  const id = uuidv4()
  const created_at = new Date().toISOString()

  await usersCol.doc(id).set({ name, username, password_hash, api_key, created_at })

  console.log('User created successfully:')
  console.log(JSON.stringify({ id, name, username, api_key, created_at }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
