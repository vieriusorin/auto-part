type WeeklySummary = {
  spent: number
  nextServiceInDays: number
  issuesDetected: number
}

export const useWeeklySummary = (): WeeklySummary => {
  return {
    spent: 0,
    nextServiceInDays: 30,
    issuesDetected: 0,
  }
}
