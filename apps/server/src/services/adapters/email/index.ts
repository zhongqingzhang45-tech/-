import type { EmailMetrics } from '../../../otel'

export interface EmailService {
  sendMagicLink(input: { to: string, url: string }): Promise<void>
  sendPasswordReset(input: { to: string, url: string }): Promise<void>
  sendVerification(input: { to: string, url: string }): Promise<void>
  sendChangeEmailConfirmation(input: { to: string, newEmail: string, url: string }): Promise<void>
  sendDeleteAccountVerification(input: { to: string, url: string }): Promise<void>
}

interface EmailServiceOptions {
  apiKey?: string
  fromEmail: string
  fromName: string
}

export function createEmailService(
  options: EmailServiceOptions,
  _templates?: unknown,
  metrics?: EmailMetrics | null,
): EmailService | null {
  if (!options.apiKey) {
    return null
  }

  const from = `${options.fromName} <${options.fromEmail}>`

  async function send(input: { to: string, subject: string, html: string, text?: string }) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Resend API error: ${res.status} ${body}`)
    }
  }

  return {
    async sendMagicLink({ to, url }) {
      metrics?.send.add(1, { email_provider: 'resend', email_type: 'magic_link' })
      await send({
        to,
        subject: 'Sign in to Life',
        html: `<p>Click the link below to sign in:</p><p><a href="${url}">Sign in</a></p>`,
        text: `Sign in: ${url}`,
      })
    },

    async sendPasswordReset({ to, url }) {
      metrics?.send.add(1, { email_provider: 'resend', email_type: 'password_reset' })
      await send({
        to,
        subject: 'Reset your Life password',
        html: `<p>Click the link below to reset your password:</p><p><a href="${url}">Reset password</a></p>`,
        text: `Reset password: ${url}`,
      })
    },

    async sendVerification({ to, url }) {
      metrics?.send.add(1, { email_provider: 'resend', email_type: 'verification' })
      await send({
        to,
        subject: 'Verify your Life email',
        html: `<p>Click the link below to verify your email:</p><p><a href="${url}">Verify email</a></p>`,
        text: `Verify email: ${url}`,
      })
    },

    async sendChangeEmailConfirmation({ to, newEmail, url }) {
      metrics?.send.add(1, { email_provider: 'resend', email_type: 'change_email' })
      await send({
        to,
        subject: 'Confirm your new Life email',
        html: `<p>We received a request to change your email to <strong>${newEmail}</strong>.</p><p>Click the link below to confirm:</p><p><a href="${url}">Confirm change</a></p>`,
        text: `Confirm email change to ${newEmail}: ${url}`,
      })
    },

    async sendDeleteAccountVerification({ to, url }) {
      metrics?.send.add(1, { email_provider: 'resend', email_type: 'delete_account' })
      await send({
        to,
        subject: 'Confirm account deletion',
        html: `<p>Click the link below to permanently delete your Life account. This action cannot be undone.</p><p><a href="${url}">Delete account</a></p>`,
        text: `Delete account: ${url}`,
      })
    },
  }
}
