import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance, BackHandler, I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

function AndroidStackBackHandler() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (segments[0] === 'ringing') {
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [router, segments]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    AsyncStorage.getItem('color_theme').then((value) => {
      if (value === 'light' || value === 'dark') {
        Appearance.setColorScheme(value);
      }
    });
  }, []);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor, direction: 'ltr' }}>
      <AppProvider>
        <AndroidStackBackHandler />
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor },
            headerTintColor: textColor,
            headerShadowVisible: false,
            contentStyle: { backgroundColor },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'BTC Alarm Clock' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="licenses" options={{ title: 'Licenses' }} />
          <Stack.Screen
            name="alarm/[id]"
            options={{ title: 'Alarm', presentation: 'modal' }}
          />
          <Stack.Screen
            name="sounds"
            options={{ title: 'Sounds', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ringing/[id]"
            options={{
              title: 'Alarm',
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
        </Stack>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
