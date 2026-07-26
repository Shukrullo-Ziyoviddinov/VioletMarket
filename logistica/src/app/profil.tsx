import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { LOGISTICA_COUNTRY_OPTIONS } from '@/types/logistica';
import { ScreenShell } from '@/components/ScreenShell';

export default function ProfilScreen() {
  const { profile } = useAuth();

  const countryLabel =
    LOGISTICA_COUNTRY_OPTIONS.find(
      (item) => item.key === profile?.logisticaCountry,
    )?.label || profile?.logisticaCountry || '—';

  return (
    <ScreenShell title="Profil">
      <View style={styles.wrap}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Kompaniya nomi</Text>
            <Text style={styles.value}>
              {profile?.companyName || profile?.name || '—'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Gmail</Text>
            <Text style={styles.value}>{profile?.email || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Logistica davlati</Text>
            <Text style={styles.value}>{countryLabel}</Text>
          </View>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  row: {
    paddingVertical: 14,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
