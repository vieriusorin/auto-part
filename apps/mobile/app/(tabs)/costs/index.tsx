import { Text, View } from 'react-native'

const CostsScreen = () => {
  return (
    <View style={{ flex: 1, padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Cost Dashboard</Text>
      <Text>Fuel, maintenance, documents, and wash charts</Text>
      <Text>Export JSON/CSV + photos ZIP from this area</Text>
    </View>
  )
}

export default CostsScreen
