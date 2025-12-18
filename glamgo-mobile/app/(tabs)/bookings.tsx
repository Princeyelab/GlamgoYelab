import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../src/lib/constants/theme';
import { useAppSelector } from '../../src/lib/store/hooks';
import { selectUpcomingBookings, selectPastBookings } from '../../src/lib/store/slices/bookingsSlice';

export default function BookingsScreen() {
  const upcomingBookings = useAppSelector(selectUpcomingBookings);
  const pastBookings = useAppSelector(selectPastBookings);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Mes Reservations</Text>
        <Text style={styles.subtitle}>
          Gerez vos rendez-vous
        </Text>

        {/* Upcoming */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A venir ({upcomingBookings.length})</Text>
          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune reservation a venir</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              {upcomingBookings.length} reservation(s)
            </Text>
          )}
        </View>

        {/* Past */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique ({pastBookings.length})</Text>
          {pastBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun historique</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              {pastBookings.length} reservation(s) passee(s)
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 60,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing['2xl'],
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  emptyState: {
    padding: spacing['2xl'],
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[400],
  },
  placeholderText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
  },
});
