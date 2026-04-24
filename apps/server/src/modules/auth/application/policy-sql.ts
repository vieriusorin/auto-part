import { and, eq, inArray, or, type AnyColumn, type SQL } from 'drizzle-orm'

type Primitive = string | number | boolean | null
type ConditionObject = Record<string, unknown>
type ColumnMap = Record<string, AnyColumn>

const toConditionClause = (conditions: ConditionObject, columns: ColumnMap): SQL | undefined => {
  const predicates: SQL[] = []
  for (const [key, value] of Object.entries(conditions)) {
    const column = columns[key]
    if (!column) {
      continue
    }
    if (Array.isArray(value)) {
      predicates.push(inArray(column, value as Primitive[]))
      continue
    }
    predicates.push(eq(column, value as Primitive))
  }
  if (predicates.length === 0) {
    return undefined
  }
  if (predicates.length === 1) {
    return predicates[0]
  }
  return and(...predicates)
}

export const buildSqlFilterFromPolicies = (
  policyConditions: readonly ConditionObject[],
  columns: ColumnMap,
): SQL | undefined => {
  const clauses = policyConditions
    .map((conditions) => toConditionClause(conditions, columns))
    .filter((clause): clause is SQL => Boolean(clause))

  if (clauses.length === 0) {
    return undefined
  }
  if (clauses.length === 1) {
    return clauses[0]
  }
  return or(...clauses)
}

