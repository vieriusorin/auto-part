import type { ZodError } from 'zod'

export class EnvValidationError extends Error {
  public readonly issues: string[]

  constructor(appName: string, issues: string[]) {
    super(
      [
        `[@autocare/config] Invalid environment for ${appName}:`,
        ...issues.map((issue) => `  - ${issue}`),
        '',
        `Fix the offending variables in your .env file (see apps/${appName}/.env.example).`,
      ].join('\n'),
    )
    this.name = 'EnvValidationError'
    this.issues = issues
  }
}

export const formatZodIssues = (error: ZodError): string[] =>
  error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
    return `${path}: ${issue.message}`
  })
