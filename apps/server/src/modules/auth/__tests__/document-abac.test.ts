import { describe, expect, it } from 'vitest'
import {
  buildDocumentPermissions,
  canReadDocumentField,
  canWriteDocumentField,
  filterReadableDocument,
  filterWritablePatch,
  type DocumentRecord,
} from '../application/document-abac.js'

const sampleDoc: DocumentRecord = {
  title: 'Fleet policy',
  content: 'Use premium oil for winter.',
  status: 'draft',
  isLocked: false,
  creatorId: 'user-1',
  lastEditedById: 'user-2',
  createdAt: new Date('2026-04-20T09:00:00.000Z'),
  updatedAt: new Date('2026-04-21T09:00:00.000Z'),
}

describe('document ABAC', () => {
  it('enforces field-level read matrix for viewer', () => {
    const perms = buildDocumentPermissions('viewer', new Date('2026-04-22T10:00:00.000Z'))
    expect(canReadDocumentField(perms, sampleDoc, 'title')).toBe(true)
    expect(canReadDocumentField(perms, sampleDoc, 'createdAt')).toBe(false)
    expect(canReadDocumentField(perms, sampleDoc, 'updatedAt')).toBe(false)
  })

  it('enforces field-level write matrix for author', () => {
    const perms = buildDocumentPermissions('author', new Date('2026-04-22T10:00:00.000Z'))
    expect(canWriteDocumentField(perms, sampleDoc, 'content')).toBe(true)
    expect(canWriteDocumentField(perms, sampleDoc, 'status')).toBe(false)
    expect(canWriteDocumentField(perms, sampleDoc, 'isLocked')).toBe(false)
  })

  it('enforces environment weekend rule for editor and author', () => {
    const weekend = new Date('2026-04-26T10:00:00.000Z') // Sunday
    const editorPerms = buildDocumentPermissions('editor', weekend)
    const authorPerms = buildDocumentPermissions('author', weekend)
    expect(editorPerms.can('document', 'update', sampleDoc, 'content')).toBe(false)
    expect(authorPerms.can('document', 'update', sampleDoc, 'content')).toBe(false)
  })

  it('filters readable and writable payloads by field permissions', () => {
    const viewerPerms = buildDocumentPermissions('viewer', new Date('2026-04-22T10:00:00.000Z'))
    const readable = filterReadableDocument(viewerPerms, sampleDoc)
    expect(readable.createdAt).toBeUndefined()
    expect(readable.updatedAt).toBeUndefined()
    expect(readable.title).toBe(sampleDoc.title)

    const authorPerms = buildDocumentPermissions('author', new Date('2026-04-22T10:00:00.000Z'))
    const patch = filterWritablePatch(authorPerms, sampleDoc, {
      title: 'Updated title',
      content: 'Updated content',
      status: 'published',
      isLocked: true,
    })
    expect(patch.title).toBe('Updated title')
    expect(patch.content).toBe('Updated content')
    expect(patch.status).toBeUndefined()
    expect(patch.isLocked).toBeUndefined()
  })
})

