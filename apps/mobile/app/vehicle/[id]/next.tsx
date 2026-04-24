import {
  useAffiliateOffers,
  useReportAffiliateComplaint,
  useTrackAffiliateClick,
  useTrackAffiliateExposure,
  useUpdateVehicleReminder,
  useVehicleActionFeed,
} from '@autocare/api-client/react'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native'
import {
  buildAffiliateClickInput,
  buildAffiliateComplaintInput,
  buildAffiliateOpenOfferAccessibilityLabel,
  buildAffiliateReportOfferAccessibilityLabel,
  shouldShowNoAffiliateOffersMessage,
} from './affiliate-offers'

const NextActionsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const vehicleId = typeof id === 'string' ? id : id?.[0]
  const feed = useVehicleActionFeed(vehicleId)
  const updateReminder = useUpdateVehicleReminder(vehicleId ?? '')
  const affiliateOffers = useAffiliateOffers({ intentSurface: 'maintenance_due' })
  const trackExposure = useTrackAffiliateExposure()
  const trackClick = useTrackAffiliateClick()
  const reportComplaint = useReportAffiliateComplaint()
  const trackedExposureOfferIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const offers = affiliateOffers.data?.items ?? []
    for (const offer of offers) {
      if (trackedExposureOfferIds.current.has(offer.id)) continue
      trackedExposureOfferIds.current.add(offer.id)
      trackExposure.mutate({
        offerId: offer.id,
        intentSurface: offer.intentSurface,
        disclosed: true,
      })
    }
  }, [affiliateOffers.data?.items, trackExposure])

  if (!vehicleId) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Missing vehicle id.</Text>
      </View>
    )
  }

  const items = feed.data?.items ?? []
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>What should I do next?</Text>
      {items.length === 0 ? <Text>No pending actions.</Text> : null}
      {items.map((item) => (
        <View
          key={item.id}
          style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 10, gap: 8 }}
        >
          <Text style={{ fontWeight: '600' }}>{item.title}</Text>
          <Text style={{ color: '#555' }}>
            {item.urgency} - {item.rationale}
          </Text>
          {item.sourceType === 'reminder' ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() =>
                  updateReminder.mutate({ reminderId: item.sourceId, body: { status: 'due_now' } })
                }
              >
                <Text style={{ color: '#2563eb' }}>Do now</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  updateReminder.mutate({ reminderId: item.sourceId, body: { status: 'upcoming' } })
                }
              >
                <Text style={{ color: '#2563eb' }}>Plan</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  updateReminder.mutate({
                    reminderId: item.sourceId,
                    body: { status: 'deferred', deferredUntil: new Date(Date.now() + 7 * 86400000).toISOString() },
                  })
                }
              >
                <Text style={{ color: '#2563eb' }}>Defer</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
      <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 12 }}>Sponsored recommendations</Text>
      {affiliateOffers.isLoading ? <ActivityIndicator /> : null}
      {affiliateOffers.error ? <Text>Unable to load sponsored recommendations right now.</Text> : null}
      {shouldShowNoAffiliateOffersMessage(
        affiliateOffers.isLoading,
        affiliateOffers.data?.items.length ?? 0,
      ) ? (
        <Text>No sponsored recommendations available for this maintenance moment.</Text>
      ) : null}
      {(affiliateOffers.data?.items ?? []).map((offer) => (
        <View
          key={offer.id}
          style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 10, gap: 6 }}
        >
          <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>{offer.disclosureLabel}</Text>
          <Text style={{ fontWeight: '600' }}>{offer.title}</Text>
          <Text style={{ color: '#555' }}>{offer.description}</Text>
          <Text style={{ color: '#555' }}>{offer.partnerName}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={buildAffiliateOpenOfferAccessibilityLabel(offer.partnerName)}
              onPress={async () => {
                trackClick.mutate(buildAffiliateClickInput(offer))
                await Linking.openURL(offer.targetUrl)
              }}
            >
              <Text style={{ color: '#2563eb' }}>Open offer</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={buildAffiliateReportOfferAccessibilityLabel(offer.partnerName)}
              onPress={() => reportComplaint.mutate(buildAffiliateComplaintInput(offer))}
            >
              <Text style={{ color: '#b91c1c' }}>Report</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {trackClick.error ? <Text>Unable to track sponsored offer click.</Text> : null}
      {reportComplaint.error ? <Text>Unable to report this sponsored offer right now.</Text> : null}
    </View>
  )
}

export default NextActionsScreen
