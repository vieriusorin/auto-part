import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useMobileAuth } from '../src/features/auth/use-mobile-auth'

const LoginScreen = () => {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useMobileAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/profile')
    }
  }, [isAuthenticated, isLoading, router])

  const onSubmit = () => {
    if (!email || !password) return
    login.mutate(
      { email, password },
      {
        onSuccess: () => router.replace('/profile'),
      },
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        placeholder='Email'
        autoCapitalize='none'
        autoCorrect={false}
        keyboardType='email-address'
        textContentType='username'
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder='Password'
        secureTextEntry
        textContentType='password'
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Pressable
        accessibilityRole='button'
        onPress={onSubmit}
        disabled={login.isPending}
        style={({ pressed }) => [
          styles.button,
          (pressed || login.isPending) && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonLabel}>{login.isPending ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>
      {login.error ? <Text style={styles.error}>{login.error.message}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#b00020',
  },
})

export default LoginScreen
