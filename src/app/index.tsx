import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { allowedDomain } from '../auth/client';
import { useAuth } from '../auth/session';
import { GoogleMark } from '../ui/GoogleMark';
import { WorkspaceArt } from '../ui/WorkspaceArt';
import { Brand, color, Notice } from '../ui/shared';

export default function Login() {
  const { profile, busy, error, configured, signIn } = useAuth();
  const wide = useWindowDimensions().width >= 850;
  if (profile) return <Redirect href="/dashboard" />;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.frame, wide && styles.wideFrame]}>
        <View style={[styles.shell, wide && styles.wideShell]}>
          <View style={[styles.hero, wide && styles.wideHero]}>
            <Brand light />
            {wide && (
              <>
                <View style={styles.heroCopy}>
                  <Text accessibilityRole="header" style={styles.heroTitle}>The HB+ team workspace</Text>
                  <Text style={styles.heroBody}>A private space for the people behind HB+.</Text>
                </View>
                <View pointerEvents="none" style={styles.art}><WorkspaceArt /></View>
              </>
            )}
          </View>

          <View style={styles.main}>
            <View style={styles.form}>
              <View style={styles.iconBox}><Feather name="lock" color={color.forest} size={23} /></View>
              <View style={styles.intro}>
                <Text accessibilityRole="header" style={styles.title}>Welcome back</Text>
                <Text style={styles.copy}>Sign in with your official Google account to access the workspace.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy, disabled: busy || !configured }}
                disabled={busy || !configured}
                onPress={signIn}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (busy || !configured) && styles.disabled]}
              >
                {busy ? <ActivityIndicator color={color.ink} /> : <GoogleMark />}
                <Text style={styles.buttonText}>{busy ? 'Connecting to Google…' : 'Login with Google'}</Text>
                {!busy && <Feather name="arrow-right" color={color.muted} size={17} />}
              </Pressable>
              {error && <Notice text={error} />}
              {!configured && <Notice text="Authentication is awaiting configuration." />}
              <View style={styles.eligibility}>
                <Feather name="shield" color={color.forest} size={18} />
                <Text style={styles.eligibilityText}>
                  Access is limited to <Text style={styles.emphasis}>@{allowedDomain}</Text> accounts.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  frame: { flexGrow: 1 },
  wideFrame: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  shell: { flex: 1, width: '100%', backgroundColor: color.white },
  wideShell: { flex: 0, flexDirection: 'row', maxWidth: 1280, minHeight: 620, borderRadius: 26, borderWidth: 1, borderColor: color.line, overflow: 'hidden' },
  hero: { backgroundColor: color.forest, padding: 25, overflow: 'hidden' },
  wideHero: { flex: 1, padding: 43, gap: 65 },
  heroCopy: { zIndex: 1, gap: 15 },
  heroTitle: { maxWidth: 380, color: color.white, fontSize: 53, lineHeight: 58, fontWeight: '700', letterSpacing: -2.7 },
  heroBody: { color: '#D2E7DB', fontSize: 17, lineHeight: 25 },
  art: { position: 'absolute', width: 490, height: 490, right: -77, bottom: -117 },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 52 },
  form: { gap: 22, width: '100%', maxWidth: 380 },
  iconBox: { backgroundColor: '#EBF3E5', width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  intro: { gap: 10 },
  title: { color: color.ink, fontSize: 43, lineHeight: 49, fontWeight: '700', letterSpacing: -2 },
  copy: { color: color.muted, fontSize: 17, lineHeight: 26 },
  button: { borderWidth: 1, borderColor: '#B9CDC3', borderRadius: 12, minHeight: 55, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  buttonPressed: { backgroundColor: '#EDF4EA' },
  disabled: { opacity: 0.65 },
  buttonText: { color: color.ink, flex: 1, fontSize: 16, fontWeight: '700' },
  eligibility: { borderTopColor: color.line, borderTopWidth: 1, paddingTop: 18, flexDirection: 'row', alignItems: 'center', gap: 9 },
  eligibilityText: { flex: 1, color: color.muted, fontSize: 14, lineHeight: 21 },
  emphasis: { color: color.forest, fontWeight: '700' },
});
