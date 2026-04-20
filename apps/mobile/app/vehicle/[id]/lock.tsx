import { Text, View } from 'react-native'

const LockScreen = () => {
  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Data Lock Mode</Text>
      <Text>Lock your vehicle history before sharing with buyers.</Text>
      <Text>All edits are blocked while locked.</Text>
    </View>
  )
}

export default LockScreen
