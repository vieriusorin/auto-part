export type InviteEmailSender = {
  sendOrganizationInvite: (input: {
    toEmail: string
    inviterUserId: string
    organizationId: string
    role: 'owner' | 'admin' | 'manager' | 'driver' | 'viewer'
    inviteToken: string
    expiresAt: Date
  }) => Promise<void>
}

export const createLoggingInviteEmailSender = (config: {
  inviteBaseUrl: string
  fromEmail: string
}): InviteEmailSender => ({
  sendOrganizationInvite: async (input) => {
    const acceptUrl = `${config.inviteBaseUrl}/invite/accept?token=${encodeURIComponent(input.inviteToken)}`
    console.info('Invite email (dev logger sender)', {
      from: config.fromEmail,
      to: input.toEmail,
      inviterUserId: input.inviterUserId,
      organizationId: input.organizationId,
      role: input.role,
      expiresAt: input.expiresAt.toISOString(),
      acceptUrl,
    })
  },
})
