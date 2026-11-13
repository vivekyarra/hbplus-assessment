import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export const color = {
  ink: '#172D29',
  muted: '#526660',
  paper: '#F5F7F2',
  white: '#FFFFFF',
  forest: '#103B33',
  moss: '#CDEDA7',
  line: '#DDE6DF',
  danger: '#8B2E32',
  dangerBg: '#FFF0EF',
};

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <View style={styles.brand}>
      <View style={styles.mark}><Text style={styles.markText}>H+</Text></View>
      <Text style={[styles.brandText, light && styles.light]}>HB+ Workspace</Text>
    </View>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.loading} accessibilityRole="progressbar">
      <ActivityIndicator color={color.forest} />
      <Text style={styles.loadingText}>Verifying your session…</Text>
    </View>
  );
}

export function Notice({ text }: { text: string }) {
  return (
    <View style={styles.notice} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Feather name="alert-circle" size={19} color={color.danger} />
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.moss, alignItems: 'center', justifyContent: 'center' },
  markText: { color: color.forest, fontSize: 18, fontWeight: '800', letterSpacing: -1 },
  brandText: { color: color.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.35 },
  light: { color: color.white },
  loading: { flex: 1, gap: 14, backgroundColor: color.paper, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: color.muted, fontSize: 15 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 12, backgroundColor: color.dangerBg },
  noticeText: { flex: 1, color: color.danger, fontSize: 14, lineHeight: 20 },
});
