import type { ContactPayload, ContactResponse } from '#shared/types/contact'

import { randomUUID } from 'node:crypto'
import { appendFile, mkdir, open } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { Resend } from 'resend'

const DEFAULT_CONTACT_TO_EMAIL = ''
const DEFAULT_CONTACT_BCC_EMAILS = ''
const DEFAULT_CONTACT_REPLY_TO_EMAIL = ''
const DEFAULT_CONTACT_SUBMISSIONS_PATH = join('.data', 'contact-submissions.csv')
const CONTACT_SUBMISSIONS_HEADERS = [
  'id',
  'submittedAt',
  'firstName',
  'lastName',
  'email',
  'phone',
  'message',
  'propertyReference',
  'userAgent',
] as const
const EMAIL_THEME = {
  fontFamily: 'Inter, Arial, sans-serif',
  background: '#ceb182',
  surface: '#f8edd6',
  foreground: '#10203b',
  secondary: '#438bab',
  border: '#d8c499',
  muted: '#31566d',
} as const

type PersistedContactSubmission = {
  id: string
  submittedAt: string
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  propertyReference: string
  userAgent: string
}

type ContactEmailConfig = {
  to: string
  bcc: string[]
  replyTo: string
  submissionsPath: string
}

// Bornes anti-abus : évitent des lignes CSV arbitrairement volumineuses et une
// croissance illimitée du fichier de soumissions.
const FIELD_MAX_LENGTHS = {
  firstName: 120,
  lastName: 120,
  email: 254,
  phone: 40,
  message: 5000,
  propertyReference: 120,
  userAgent: 512,
} as const

const sanitize = (value: unknown, maxLength?: number): string => {
  const trimmed = typeof value === 'string' ? value.trim() : ''

  return typeof maxLength === 'number' ? trimmed.slice(0, maxLength) : trimmed
}

const parseEmailList = (value: unknown): string[] => {
  const rawValue = sanitize(value)

  if (!rawValue) {
    return []
  }

  if (rawValue.startsWith('[')) {
    try {
      const parsedValue: unknown = JSON.parse(rawValue)

      if (Array.isArray(parsedValue)) {
        return parsedValue.map((email) => sanitize(email)).filter(Boolean)
      }
    } catch {
      return []
    }
  }

  return rawValue
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
}

const resolveContactEmailConfig = (
  config: ReturnType<typeof useRuntimeConfig>,
): ContactEmailConfig => {
  return {
    to: sanitize(config.contactToEmail) || DEFAULT_CONTACT_TO_EMAIL,
    bcc: parseEmailList(sanitize(config.contactBccEmails) || DEFAULT_CONTACT_BCC_EMAILS),
    replyTo: sanitize(config.contactReplyToEmail) || DEFAULT_CONTACT_REPLY_TO_EMAIL,
    submissionsPath: resolve(
      process.cwd(),
      sanitize(config.contactSubmissionsPath) || DEFAULT_CONTACT_SUBMISSIONS_PATH,
    ),
  }
}

const isNodeError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && 'code' in error
}

// Neutralise l'injection de formule (CSV injection) : un champ commençant par
// = + - @ TAB ou CR est interprété comme une formule par Excel / Sheets / LibreOffice.
// On préfixe par une apostrophe pour forcer l'interprétation en texte.
const neutralizeCsvFormula = (value: string): string => {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

const escapeCsvValue = (value: string): string => {
  const safeValue = neutralizeCsvFormula(value)

  if (!/[",\n\r]/.test(safeValue)) {
    return safeValue
  }

  return `"${safeValue.replaceAll('"', '""')}"`
}

const buildContactSubmissionCsvRow = (record: PersistedContactSubmission): string => {
  return CONTACT_SUBMISSIONS_HEADERS.map((field) => escapeCsvValue(record[field])).join(',')
}

const ensureContactSubmissionCsv = async (submissionsPath: string): Promise<void> => {
  try {
    const file = await open(submissionsPath, 'wx')

    try {
      await file.writeFile(`${CONTACT_SUBMISSIONS_HEADERS.join(',')}\n`, 'utf8')
    } finally {
      await file.close()
    }
  } catch (error) {
    if (!isNodeError(error) || error.code !== 'EEXIST') {
      throw error
    }
  }
}

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const renderEmailLayout = (title: string, content: string, replyToEmail: string): string => {
  const escapedReplyToEmail = escapeHtml(replyToEmail)

  return `
    <div style="margin:0;padding:32px 16px;background:${EMAIL_THEME.background};font-family:${EMAIL_THEME.fontFamily};color:${EMAIL_THEME.foreground};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-collapse:collapse;background:${EMAIL_THEME.surface};border:1px solid ${EMAIL_THEME.border};">
        <tr>
          <td style="padding:28px 28px 18px 28px;border-bottom:1px solid ${EMAIL_THEME.border};">
            <p style="margin:0 0 10px 0;font-size:11px;line-height:1.4;letter-spacing:0.22em;text-transform:uppercase;color:${EMAIL_THEME.muted};">Showcase Immobilier</p>
            <h1 style="margin:0;font-family:${EMAIL_THEME.fontFamily};font-size:24px;line-height:1.2;font-weight:500;color:${EMAIL_THEME.foreground};">${escapeHtml(title)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 28px;font-size:15px;line-height:1.7;color:${EMAIL_THEME.foreground};">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid ${EMAIL_THEME.border};font-size:12px;line-height:1.6;color:${EMAIL_THEME.muted};">
            Showcase Immobilier · Essaouira<br />
            <a href="mailto:${escapedReplyToEmail}" style="color:${EMAIL_THEME.secondary};text-decoration:none;">${escapedReplyToEmail}</a>
          </td>
        </tr>
      </table>
    </div>
  `
}

const renderParagraph = (content: string): string => {
  return `<p style="margin:0 0 16px 0;">${content}</p>`
}

const renderDetail = (label: string, value: string): string => {
  return `
    <p style="margin:0 0 10px 0;">
      <strong style="font-weight:600;color:${EMAIL_THEME.foreground};">${escapeHtml(label)} :</strong>
      ${escapeHtml(value)}
    </p>
  `
}

const buildConfirmationEmail = (
  firstName: string,
  propertyReference: string,
  replyToEmail: string,
): { subject: string; html: string; text: string } => {
  const escapedFirstName = escapeHtml(firstName)
  const escapedPropertyReference = escapeHtml(propertyReference)
  const propertyContext = propertyReference
    ? ` au sujet du bien ${escapedPropertyReference}`
    : ' au sujet de votre projet immobilier'

  const recommendation = propertyReference
    ? 'Pour préparer notre échange, vous pouvez déjà préciser vos disponibilités, vos critères prioritaires et vos éventuelles questions sur le bien.'
    : 'Pour préparer notre échange, vous pouvez déjà préciser votre budget, le secteur recherché, votre calendrier et les critères les plus importants pour vous.'

  return {
    subject: 'Nous avons bien reçu votre message — Showcase Immobilier',
    html: renderEmailLayout(
      'Nous avons bien reçu votre message',
      [
        renderParagraph(`Bonjour ${escapedFirstName},`),
        renderParagraph(`Nous avons bien reçu votre message${propertyContext}.`),
        renderParagraph(escapeHtml(recommendation)),
        renderParagraph('Notre équipe revient vers vous rapidement avec une réponse adaptée.'),
        `<p style="margin:22px 0 0 0;color:${EMAIL_THEME.muted};">À bientôt,<br />Showcase Immobilier</p>`,
      ].join(''),
      replyToEmail,
    ),
    text: [
      `Bonjour ${firstName},`,
      '',
      `Nous avons bien reçu votre message${
        propertyReference
          ? ` au sujet du bien ${propertyReference}`
          : ' au sujet de votre projet immobilier'
      }.`,
      '',
      recommendation,
      '',
      'Notre équipe revient vers vous rapidement avec une réponse adaptée.',
      '',
      'À bientôt,',
      'Showcase Immobilier',
    ].join('\n'),
  }
}

const persistContactSubmission = async (
  submissionsPath: string,
  submission: Omit<PersistedContactSubmission, 'id' | 'submittedAt'>,
): Promise<void> => {
  const record: PersistedContactSubmission = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    ...submission,
  }

  await mkdir(dirname(submissionsPath), { recursive: true })
  await ensureContactSubmissionCsv(submissionsPath)
  await appendFile(submissionsPath, `${buildContactSubmissionCsvRow(record)}\n`, 'utf8')
}

export default defineEventHandler(async (event): Promise<ContactResponse> => {
  const config = useRuntimeConfig()
  const contactEmailConfig = resolveContactEmailConfig(config)
  const body = await readBody<ContactPayload>(event)

  const firstName = sanitize(body.firstName, FIELD_MAX_LENGTHS.firstName)
  const lastName = sanitize(body.lastName, FIELD_MAX_LENGTHS.lastName)
  const email = sanitize(body.email, FIELD_MAX_LENGTHS.email)
  const phone = sanitize(body.phone, FIELD_MAX_LENGTHS.phone)
  const message = sanitize(body.message, FIELD_MAX_LENGTHS.message)
  const website = sanitize(body.website)
  const propertyReference = sanitize(body.propertyReference, FIELD_MAX_LENGTHS.propertyReference)

  if (website.length > 0) {
    return {
      success: true,
    }
  }

  if (!firstName || !email || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required contact fields',
    })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email address',
    })
  }

  // Config de déploiement statique : à valider avant de persister, pour ne pas
  // stocker une soumission qui ne pourra jamais être envoyée par email.
  if (!config.resendApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing Resend API key',
    })
  }

  if (!contactEmailConfig.to || !contactEmailConfig.replyTo) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing contact email configuration',
    })
  }

  try {
    await persistContactSubmission(contactEmailConfig.submissionsPath, {
      firstName,
      lastName,
      email,
      phone,
      message,
      propertyReference,
      userAgent: sanitize(getRequestHeader(event, 'user-agent'), FIELD_MAX_LENGTHS.userAgent),
    })
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to persist contact submission',
    })
  }

  const resend = new Resend(config.resendApiKey)

  const subject = propertyReference
    ? `Demande de contact — Bien ${propertyReference}`
    : 'Demande de contact'

  const html = renderEmailLayout(
    'Nouvelle demande de contact',
    [
      propertyReference ? renderDetail('Référence du bien', propertyReference) : '',
      renderDetail('Prénom', firstName),
      lastName ? renderDetail('Nom', lastName) : '',
      renderDetail('Email', email),
      phone ? renderDetail('Téléphone', phone) : '',
      `<div style="height:1px;background:${EMAIL_THEME.border};margin:24px 0;"></div>`,
      `<p style="margin:0 0 8px 0;"><strong style="font-weight:600;color:${EMAIL_THEME.foreground};">Message :</strong></p>`,
      `<p style="margin:0;white-space:pre-line;">${escapeHtml(message)}</p>`,
    ].join(''),
    contactEmailConfig.replyTo,
  )

  const text = [
    'Nouvelle demande de contact',
    '',
    propertyReference ? `Référence du bien : ${propertyReference}` : '',
    `Prénom : ${firstName}`,
    lastName ? `Nom : ${lastName}` : '',
    `Email : ${email}`,
    phone ? `Téléphone : ${phone}` : '',
    '',
    'Message :',
    message,
  ]
    .filter(Boolean)
    .join('\n')

  const { error } = await resend.emails.send({
    from: config.resendFromEmail,
    to: contactEmailConfig.to,
    bcc: contactEmailConfig.bcc.length > 0 ? contactEmailConfig.bcc : undefined,
    replyTo: email,
    subject,
    html,
    text,
  })

  if (error) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to send contact email',
    })
  }

  const confirmationEmail = buildConfirmationEmail(
    firstName,
    propertyReference,
    contactEmailConfig.replyTo,
  )
  const { error: confirmationError } = await resend.emails.send({
    from: config.resendFromEmail,
    to: email,
    replyTo: contactEmailConfig.replyTo,
    subject: confirmationEmail.subject,
    html: confirmationEmail.html,
    text: confirmationEmail.text,
  })

  if (confirmationError) {
    console.error('[contact] Unable to send confirmation email')
  }

  return {
    success: true,
    confirmationSent: !confirmationError,
  }
})
