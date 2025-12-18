import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography } from '../../src/lib/constants/theme';
import { useAppSelector } from '../../src/lib/store/hooks';
import { selectUser } from '../../src/lib/store/slices/authSlice';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAppSelector(selectUser);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour{user ? `, ${user.first_name || user.name?.split(' ')[0] || ''}` : ''} 👋
          </Text>
          <Text style={styles.subtitle}>
            Trouvez les meilleurs services pres de chez vous
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>

          <Button
            variant="primary"
            fullWidth
            onPress={() => router.push('/(tabs)/services')}
            style={styles.actionButton}
          >
            Explorer les services
          </Button>

          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push('/(tabs)/bookings')}
            style={styles.actionButton}
          >
            Mes reservations
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onPress={() => router.push('/test-components')}
            style={styles.actionButton}
          >
            Test Composants UI
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onPress={() => router.push('/test-full')}
            style={styles.actionButton}
          >
            Tests Complets API
          </Button>
        </View>

        {/* User Status */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.name || 'Utilisateur'}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        )}
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
  header: {
    marginBottom: spacing['2xl'],
  },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
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
  actionButton: {
    marginBottom: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
});
