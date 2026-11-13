import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { allowedDomain } from '../auth/client';
import { useAuth } from '../auth/session';
import { Brand, color, Notice } from '../ui/shared';
import { WorkspaceArt } from '../ui/WorkspaceArt';

export default function Dashboard() {
  const { profile, busy, error, signOut } = useAuth();
  const wide = useWindowDimensions().width >= 720;
  if (!profile) return <Redirect href="/" />;
  const role = profile.role === 'admin' ? 'Admin' : 'User';
  const joined = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(profile.created_at));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <View style={styles.nav}>
          <Brand />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            onPress={signOut}
            style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          >
            {busy ? <ActivityIndicator color={color.forest} /> : <Feather name="log-out" size={17} color={color.forest} />}
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.banner}>
            <View style={styles.bannerCopy}>
              <Text accessibilityRole="header" style={[styles.heading, wide && styles.headingWide]}>Your workspace</Text>
              <Text style={styles.subtitle}>You’re signed in with a verified HB+ account.</Text>
            </View>
            {wide && <View pointerEvents="none" style={styles.art}><WorkspaceArt /></View>}
          </View>
          {error && <Notice text={error} />}
          <View style={[styles.cards, wide && styles.row]}>
            <View style={styles.card}>
              <Feather name="user" color={color.forest} size={22} />
              <Text accessibilityRole="header" style={styles.cardTitle}>Your account</Text>
              <Field label="Email" value={profile.email} />
              <Field label="Workspace member since" value={joined} />
            </View>
            <View style={styles.card}>
              <Feather name="shield" color={color.forest} size={22} />
              <Text accessibilityRole="header" style={styles.cardTitle}>Access</Text>
              <Field label="Verified domain" value={`@${allowedDomain}`} />
              <Field label="Role" value={role} />
            </View>
          </View>
          {profile.role === 'admin' && (
            <View style={styles.card}>
              <Feather name="settings" color={color.forest} size={22} />
              <Text accessibilityRole="header" style={styles.cardTitle}>Administration</Text>
              <Text style={styles.label}>Your workspace administrator role is active.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  top: { backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line, paddingHorizontal: 20 },
  nav: { width: '100%', maxWidth: 1056, alignSelf: 'center', paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  logout: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 13, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: color.line },
  pressed: { backgroundColor: color.paper },
  logoutText: { color: color.forest, fontWeight: '700', fontSize: 14 },
  scroll: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  content: { width: '100%', maxWidth: 1056, gap: 18 },
  banner: { backgroundColor: color.forest, borderRadius: 20, overflow: 'hidden', minHeight: 170, justifyContent: 'center', padding: 25 },
  bannerCopy: { zIndex: 1, gap: 10 },
  heading: { color: color.white, fontSize: 36, fontWeight: '700', letterSpacing: -1.4 },
  headingWide: { fontSize: 47 },
  subtitle: { color: '#D6EBDF', fontSize: 16, lineHeight: 24 },
  art: { position: 'absolute', width: 350, height: 350, right: -15, bottom: -135 },
  cards: { gap: 18 },
  row: { flexDirection: 'row' },
  card: { flex: 1, backgroundColor: color.white, padding: 23, gap: 12, borderRadius: 18, borderWidth: 1, borderColor: color.line },
  cardTitle: { color: color.ink, fontSize: 21, fontWeight: '700' },
  field: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: 11, gap: 4 },
  label: { color: color.muted, fontSize: 14, lineHeight: 20 },
  value: { color: color.ink, fontSize: 15, fontWeight: '600' },
});
