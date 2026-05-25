// VAPID public key — safe to commit (it's the *public* half of the keypair).
// Matching VAPID_PRIVATE_KEY must live in Vercel Environment Variables.
// To rotate: regenerate with `npx web-push generate-vapid-keys`, paste the
// new public key here, then put the new private key on Vercel and redeploy.
export const VAPID_PUBLIC_KEY =
  'BH7qntnyzLf0hU9b5TfappKY8wDxWSnaxdz92875MF-xQABrxl8njBpGbB8kmKrFQrvg-1a2wTIg3yKq4RYP6CI';
