import { Text, View } from 'react-native'

const EmergencyScreen = () => {
  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Emergency Mode</Text>
      <Text>Insurance policy: RCA-123456</Text>
      <Text>Insurer phone: +40 21 000 0000</Text>
      <Text>Roadside assistance: +40 800 111 222</Text>
    </View>
  )
}

export default EmergencyScreen
