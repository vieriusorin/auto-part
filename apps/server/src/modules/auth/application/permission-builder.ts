import { and, eq, inArray, or, type AnyColumn, type SQL } from 'drizzle-orm'

type Primitive = string | number | boolean | null
type RuleConditions<TResource extends Record<string, unknown>> = Partial<{
  [K in keyof TResource]: TResource[K] | readonly TResource[K][]
}>

type PermissionRule<
  TResourceName extends string,
  TAction extends string,
  TResource extends Record<string, unknown>,
  TField extends string,
> = {
  resource: TResourceName
  action: TAction
  conditions?: RuleConditions<TResource>
  fields?: readonly TField[]
}

type ColumnMap = Record<string, AnyColumn>

const valueMatches = (expected: unknown, actual: unknown): boolean => {
  if (Array.isArray(expected)) {
    return expected.some((candidate) => candidate === actual)
  }
  return expected === actual
}

const resourceMatches = <TResource extends Record<string, unknown>>(
  conditions: RuleConditions<TResource> | undefined,
  resource: TResource | undefined,
): boolean => {
  if (!conditions) return true
  if (!resource) return false
  for (const [key, expected] of Object.entries(conditions)) {
    const actual = resource[key as keyof TResource]
    if (!valueMatches(expected, actual)) {
      return false
    }
  }
  return true
}

const conditionToSql = (
  conditions: Record<string, unknown>,
  columnMap: ColumnMap,
): SQL | undefined => {
  const predicates: SQL[] = []
  for (const [key, expected] of Object.entries(conditions)) {
    const column = columnMap[key]
    if (!column) {
      continue
    }
    if (Array.isArray(expected)) {
      predicates.push(inArray(column, expected as Primitive[]))
      continue
    }
    predicates.push(eq(column, expected as Primitive))
  }
  if (predicates.length === 0) {
    return undefined
  }
  if (predicates.length === 1) {
    return predicates[0]
  }
  return and(...predicates)
}

export class PermissionBuilder<
  TResourceName extends string,
  TAction extends string,
  TResource extends Record<string, unknown>,
  TField extends string,
> {
  private readonly rules: PermissionRule<TResourceName, TAction, TResource, TField>[] = []

  allow(
    resource: TResourceName,
    action: TAction,
    conditions?: RuleConditions<TResource>,
    fields?: readonly TField[],
  ): this {
    this.rules.push({
      resource,
      action,
      conditions,
      fields,
    })
    return this
  }

  can(resource: TResourceName, action: TAction, data?: TResource, field?: TField): boolean {
    const matchingRules = this.rules.filter(
      (rule) =>
        rule.resource === resource &&
        rule.action === action &&
        resourceMatches(rule.conditions, data),
    )
    if (matchingRules.length === 0) {
      return false
    }
    if (!field) {
      return true
    }
    return matchingRules.some((rule) => !rule.fields || rule.fields.includes(field))
  }

  getAllowedFields(
    resource: TResourceName,
    action: TAction,
    data: TResource | undefined,
    allFields: readonly TField[],
  ): TField[] {
    const matchingRules = this.rules.filter(
      (rule) =>
        rule.resource === resource &&
        rule.action === action &&
        resourceMatches(rule.conditions, data),
    )
    if (matchingRules.length === 0) {
      return []
    }
    if (matchingRules.some((rule) => !rule.fields)) {
      return [...allFields]
    }
    const allowed = new Set<TField>()
    for (const rule of matchingRules) {
      for (const field of rule.fields ?? []) {
        allowed.add(field)
      }
    }
    return [...allowed]
  }

  toSqlWhere(resource: TResourceName, action: TAction, columnMap: ColumnMap): SQL | undefined {
    const sqlRules = this.rules
      .filter((rule) => rule.resource === resource && rule.action === action)
      .map((rule) => conditionToSql((rule.conditions ?? {}) as Record<string, unknown>, columnMap))
      .filter((clause): clause is SQL => Boolean(clause))

    if (sqlRules.length === 0) {
      return undefined
    }
    if (sqlRules.length === 1) {
      return sqlRules[0]
    }
    return or(...sqlRules)
  }
}

export const isWeekend = (now: Date): boolean => {
  const day = now.getDay()
  return day === 0 || day === 6
}

