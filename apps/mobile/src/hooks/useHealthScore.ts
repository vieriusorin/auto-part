type HealthInput = {
  overdueMaintenance: number
  expiredDocuments: number
  missingLogs: number
  missingPhotoProof: number
}

export const calculateHealthScore = (input: HealthInput): number => {
  const score =
    100 -
    input.overdueMaintenance * 15 -
    input.expiredDocuments * 20 -
    input.missingLogs * 5 -
    input.missingPhotoProof * 5
  return Math.max(0, Math.min(100, score))
}
