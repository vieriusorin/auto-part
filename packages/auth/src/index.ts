export type GarageRole = 'owner' | 'admin' | 'member' | 'editor' | 'viewer'

export const rolePermissions: Record<GarageRole, string[]> = {
  owner: ['*'],
  admin: ['vehicles.manage', 'logs.manage', 'members.invite'],
  member: ['vehicles.read', 'logs.create', 'logs.read'],
  editor: ['vehicles.read', 'logs.create', 'logs.read', 'logs.update'],
  viewer: ['vehicles.read', 'logs.read'],
}

export const hasPermission = (role: GarageRole, permission: string): boolean => {
  const set = rolePermissions[role]
  return set.includes('*') || set.includes(permission)
}
