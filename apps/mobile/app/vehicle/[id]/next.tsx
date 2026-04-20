import { Text, View } from 'react-native'

const NextActionsScreen = () => {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>What should I do next?</Text>
      <Text>Oil change overdue by 2,000 km</Text>
      <Text>Insurance expires in 5 days</Text>
      <Text>ITP due next month</Text>
    </View>
  )
}

export default NextActionsScreen
