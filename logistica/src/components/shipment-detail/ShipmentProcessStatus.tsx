import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import {
  PROCESS_STEPS,
  type ProcessStepKey,
} from '@/constants/shipmentProcess';

const ACCENT = '#7c3aed';

type Props = {
  activeStep: ProcessStepKey | null;
};

export function ShipmentProcessStatus({ activeStep }: Props) {
  const activeIndex = PROCESS_STEPS.findIndex((step) => step.key === activeStep);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Jarayon holati</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          {PROCESS_STEPS.map((step, index) => {
            const done = activeIndex >= 0 && index <= activeIndex;
            const isLast = index === PROCESS_STEPS.length - 1;

            return (
              <View key={step.key} style={styles.stepWrap}>
                <View style={styles.stepTop}>
                  <View
                    style={[
                      styles.circle,
                      done ? styles.circleActive : styles.circleIdle,
                    ]}
                  >
                    <Ionicons
                      name={step.icon}
                      size={16}
                      color={done ? '#FFFFFF' : '#9CA3AF'}
                    />
                  </View>
                  {!isLast ? (
                    <View
                      style={[
                        styles.line,
                        done && index < activeIndex ? styles.lineActive : null,
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[styles.stepLabel, done && styles.stepLabelActive]}
                  numberOfLines={2}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  stepTop: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  circleActive: {
    backgroundColor: ACCENT,
  },
  circleIdle: {
    backgroundColor: '#F3F4F6',
  },
  line: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E5E7EB',
    top: 16,
  },
  lineActive: {
    backgroundColor: ACCENT,
  },
  stepLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 13,
    paddingHorizontal: 2,
  },
  stepLabelActive: {
    color: ACCENT,
  },
});
