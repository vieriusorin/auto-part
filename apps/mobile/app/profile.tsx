import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useMobileAuth } from '../src/features/auth/use-mobile-auth'

const ProfileScreen = () => {
  const router = useRouter()
  const { user, permissions, isAuthenticated, isLoading, signOut, logout, can } = useMobileAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading…</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text>{user.email}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Role</Text>
        <Text>{user.role}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Permissions</Text>
        {permissions.map((perm) => (
          <Text key={perm} style={styles.code}>
            {perm}
          </Text>
        ))}
      </View>

      <Pressable
        accessibilityRole='button'
        disabled={!can('logs.create')}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          !can('logs.create') && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonLabel}>Add maintenance log</Text>
      </Pressable>

      <Pressable
        accessibilityRole='button'
        onPress={async () => {
          await signOut()
          router.replace('/login')
        }}
        disabled={logout.isPending}
        style={({ pressed }) => [
          styles.button,
          styles.buttonSecondary,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.buttonLabel, styles.buttonLabelSecondary]}>
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  section: {
    gap: 4,
  },
  label: {
    fontWeight: '600',
    color: '#555',
  },
  code: {
    fontFamily: 'Menlo',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: '#eee',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonLabelSecondary: {
    color: '#111',
  },
})

export default ProfileScreen
