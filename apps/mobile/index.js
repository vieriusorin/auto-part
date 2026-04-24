import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

// Work around Android inset-correction crash in react-native-screens.
enableScreens(false);

const App = () => {
  const { ExpoRoot } = require('expo-router');
  const ctx = require.context(
    './app',
    true,
    /^(?:\.\/)(?!.*(?:__tests__|\.test\.|\.spec\.))(?!.*\/components\/)(?!.*(?:\+api|\+html|\+middleware)\.(?:jsx|tsx)$).*\.(?:jsx|tsx)$/,
  );
  return <ExpoRoot context={ctx} />;
};

registerRootComponent(App);
