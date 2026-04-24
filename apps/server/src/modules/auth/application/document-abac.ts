import { PermissionBuilder, isWeekend } from './permission-builder.js'

export type DocumentRole = 'admin' | 'editor' | 'author' | 'viewer'
export type DocumentAction = 'read' | 'create' | 'update'
export type DocumentResourceName = 'document'

export type DocumentRecord = {
  title: string
  content: string
  status: 'draft' | 'published' | 'archived'
  isLocked: boolean
  creatorId: string
  lastEditedById: string
  createdAt: Date
  updatedAt: Date
}

export type DocumentField = keyof DocumentRecord

const AllDocumentFields: readonly DocumentField[] = [
  'title',
  'content',
  'status',
  'isLocked',
  'creatorId',
  'lastEditedById',
  'createdAt',
  'updatedAt',
]

const WritableByAdmin: readonly DocumentField[] = ['title', 'content', 'status', 'isLocked']
const WritableByEditor: readonly DocumentField[] = ['title', 'content', 'status']
const WritableByAuthor: readonly DocumentField[] = ['title', 'content']

export type DocumentPermissionSet = ReturnType<typeof buildDocumentPermissions>

export const buildDocumentPermissions = (role: DocumentRole, now = new Date()) => {
  const builder = new PermissionBuilder<
    DocumentResourceName,
    DocumentAction,
    DocumentRecord,
    DocumentField
  >()

  if (role === 'viewer') {
    builder.allow('document', 'read', undefined, [
      'title',
      'content',
      'status',
      'isLocked',
      'creatorId',
      'lastEditedById',
    ])
    return builder
  }

  // Admin/editor/author can read all fields.
  builder.allow('document', 'read')

  if (role === 'admin') {
    builder.allow('document', 'create', undefined, WritableByAdmin)
    builder.allow('document', 'update', { isLocked: false }, WritableByAdmin)
    return builder
  }

  if (!isWeekend(now)) {
    if (role === 'editor') {
      builder.allow('document', 'create', undefined, WritableByEditor)
      builder.allow('document', 'update', { isLocked: false }, WritableByEditor)
    }
    if (role === 'author') {
      builder.allow('document', 'create', undefined, WritableByAuthor)
      builder.allow('document', 'update', { isLocked: false }, WritableByAuthor)
    }
  }

  return builder
}

export const canReadDocumentField = (
  permissions: DocumentPermissionSet,
  doc: DocumentRecord,
  field: DocumentField,
): boolean => permissions.can('document', 'read', doc, field)

export const canWriteDocumentField = (
  permissions: DocumentPermissionSet,
  doc: DocumentRecord,
  field: DocumentField,
): boolean => permissions.can('document', 'update', doc, field)

export const filterReadableDocument = (
  permissions: DocumentPermissionSet,
  doc: DocumentRecord,
): Partial<DocumentRecord> => {
  const allowedFields = permissions.getAllowedFields('document', 'read', doc, AllDocumentFields)
  const result: Partial<DocumentRecord> = {}
  for (const field of allowedFields) {
    ;(result as Record<DocumentField, DocumentRecord[DocumentField]>)[field] = doc[field]
  }
  return result
}

export const filterWritablePatch = (
  permissions: DocumentPermissionSet,
  doc: DocumentRecord,
  patch: Partial<DocumentRecord>,
): Partial<DocumentRecord> => {
  const allowedFields = new Set(permissions.getAllowedFields('document', 'update', doc, AllDocumentFields))
  const filtered: Partial<DocumentRecord> = {}
  for (const [key, value] of Object.entries(patch)) {
    const field = key as DocumentField
    if (allowedFields.has(field)) {
      ;(filtered as Record<DocumentField, DocumentRecord[DocumentField]>)[field] =
        value as DocumentRecord[DocumentField]
    }
  }
  return filtered
}

