import { useAuth, useCreateVehicle, useVehicles } from '@autocare/api-client/react'
import { Link } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { getGarageEmptyMessage } from '../../../src/screen-messages'

type VehiclesResult = ReturnType<typeof useVehicles>
type VehicleItem = NonNullable<NonNullable<VehiclesResult['data']>['items']>[number]

const GarageScreen = () => {
  const { isAuthenticated } = useAuth()
  const vehicles = useVehicles({ enabled: isAuthenticated })
  const createVehicle = useCreateVehicle()
  const vehicleCount = vehicles.data?.items?.length ?? 0
  const latestVehicle = vehicles.data?.items?.[0]

  if (!isAuthenticated) {
    return (
      <View className='flex-1 bg-surface dark:bg-surface-dark px-4 pt-4'>
        <View className='bg-card dark:bg-card-dark rounded-lg p-4 gap-2'>
          <Text className='text-caption font-semibold uppercase text-slate-700 dark:text-slate-300'>
            Current status
          </Text>
          <Text className='text-h1 font-bold text-slate-900 dark:text-slate-50'>
            Garage access locked
          </Text>
          <Text className='text-body text-slate-700 dark:text-slate-300'>
            Sign in to see your vehicles, maintenance timeline, and recommendations.
          </Text>
        </View>
        <View className='bg-accent rounded-lg p-4 gap-[10px] mt-3'>
          <Text className='text-caption font-bold uppercase text-amber-900'>
            Recommended next step
          </Text>
          <Text className='text-h3 font-bold text-slate-900'>Connect your account to continue</Text>
          <Link href='/login' asChild>
            <Pressable className='min-h-11 rounded-md items-center justify-center bg-secondary px-[14px] py-[10px]'>
              <Text className='text-body font-bold text-white'>Go to login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      className='flex-1 bg-surface dark:bg-surface-dark'
      contentContainerClassName='gap-3 p-4 pb-6'
    >
      <View className='bg-card dark:bg-card-dark rounded-lg p-4 gap-2'>
        <Text className='text-caption font-semibold uppercase text-slate-700 dark:text-slate-300'>
          Current status
        </Text>
        <Text className='text-h1 font-bold text-slate-900 dark:text-slate-50'>
          {latestVehicle
            ? `${latestVehicle.make} ${latestVehicle.model} ready`
            : 'Your garage is ready'}
        </Text>
        <Text className='text-body text-slate-700 dark:text-slate-300'>
          Quick access to vehicles and maintenance timelines.
        </Text>
      </View>

      <View className='flex-row gap-[10px]'>
        <View className='flex-1 rounded-md bg-cardMuted dark:bg-cardMuted-dark p-3 gap-[6px]'>
          <Text className='text-caption font-medium text-slate-700 dark:text-slate-300'>Vehicles</Text>
          <Text className='text-h3 font-bold text-slate-900 dark:text-slate-50'>{vehicleCount}</Text>
        </View>
        <View className='flex-1 rounded-md bg-cardMuted dark:bg-cardMuted-dark p-3 gap-[6px]'>
          <Text className='text-caption font-medium text-slate-700 dark:text-slate-300'>
            Last update
          </Text>
          <Text className='text-h3 font-bold text-slate-900 dark:text-slate-50'>
            {vehicles.isPending ? 'Syncing...' : 'Now'}
          </Text>
        </View>
      </View>

      <View className='bg-accent rounded-lg p-4 gap-[10px]'>
        <Text className='text-caption font-bold uppercase text-amber-900'>Recommendations</Text>
        <Text className='text-h3 font-bold text-slate-900'>
          Add a vehicle to unlock smart timeline tracking
        </Text>
        <Pressable
          onPress={() =>
            createVehicle.mutate({
              make: 'Skoda',
              model: 'Octavia',
              year: 2020,
              vin: `VIN${Date.now().toString(36).toUpperCase().slice(-10)}`,
            })
          }
          className={`min-h-11 rounded-md items-center justify-center bg-secondary px-[14px] py-[10px] ${createVehicle.isPending ? 'opacity-60' : ''}`}
          disabled={createVehicle.isPending}
        >
          <Text className='text-body font-bold text-white'>
            {createVehicle.isPending ? 'Adding...' : 'Add sample vehicle'}
          </Text>
        </Pressable>
      </View>

      <View className='bg-card dark:bg-card-dark rounded-lg p-4 gap-[10px]'>
        <Text className='text-h3 font-bold text-slate-900 dark:text-slate-50'>Latest vehicles</Text>
        {vehicles.isPending ? <ActivityIndicator className='mt-2' /> : null}
        {vehicles.isError ? <Text className='text-danger mt-2'>Could not load vehicles.</Text> : null}
        {!vehicles.isPending && !vehicles.isError && vehicleCount === 0 ? (
          <Text className='text-body text-slate-700 dark:text-slate-300 mt-2'>
            {getGarageEmptyMessage()}
          </Text>
        ) : null}
        {!vehicles.isPending && !vehicles.isError
          ? vehicles.data?.items?.map((item: VehicleItem) => (
              <Link key={item.id} href={`/vehicle/${item.id}`} asChild>
                <Pressable className='rounded-md bg-cardMuted dark:bg-cardMuted-dark p-3 gap-1'>
                  <Text className='text-base font-bold text-slate-900 dark:text-slate-50'>
                    {item.make} {item.model}
                  </Text>
                  <Text className='text-bodysm text-slate-700 dark:text-slate-300'>
                    {item.year} · {item.currentOdometer} km
                  </Text>
                </Pressable>
              </Link>
            ))
          : null}
      </View>
    </ScrollView>
  )
}

export default GarageScreen
