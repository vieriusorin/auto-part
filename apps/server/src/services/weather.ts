export type WeatherSuggestion = {
  shouldWash: boolean
  message: string
}

export const getWashSuggestion = (): WeatherSuggestion => {
  return {
    shouldWash: true,
    message: 'No rain forecast in 48h. Good time for a wash.',
  }
}
