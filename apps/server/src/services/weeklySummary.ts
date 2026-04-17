export type WeeklySummary = {
  spent: number
  nextServiceInDays: number
  issuesDetected: number
}

export const buildWeeklySummary = (): WeeklySummary => {
  return {
    spent: 0,
    nextServiceInDays: 30,
    issuesDetected: 0,
  }
}
