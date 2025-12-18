import React from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Button from './Button';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';

type ModalPosition = 'center' | 'bottom' | 'full';
type ModalSize = 'sm' | 'md' | 'lg' | 'full';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: ModalPosition;
  size?: ModalSize;
  showCloseButton?: boolean;
  dismissible?: boolean;
  showFooter?: boolean;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  contentStyle?: ViewStyle;
}

const { height: screenHeight } = Dimensions.get('window');

export default function Modal({
  visible,
  onClose,
  title,
  children,
  position = 'center',
  size = 'md',
  showCloseButton = true,
  dismissible = true,
  showFooter = false,
  cancelText = 'Annuler',
  confirmText = 'Confirmer',
  onCancel,
  onConfirm,
  confirmLoading = false,
  confirmDisabled = false,
  contentStyle,
}: ModalProps) {
  const handleBackdropPress = () => {
    if (dismissible) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const getContainerStyle = (): ViewStyle => {
    if (position === 'full') {
      return styles.containerFull;
    }
    if (position === 'bottom') {
      return styles.containerBottom;
    }
    return styles.containerCenter;
  };

  const getContentStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.content];

    if (position !== 'full') {
      baseStyle.push(sizeStyles[size]);
    } else {
      baseStyle.push(styles.contentFull);
    }

    if (position === 'bottom') {
      baseStyle.push(styles.contentBottom);
    }

    return baseStyle;
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={position === 'bottom' ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />

        {/* Modal Content */}
        <View style={getContainerStyle()}>
          <View style={[...getContentStyle(), contentStyle]}>
            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {title ? (
                  <Text style={styles.title}>{title}</Text>
                ) : (
                  <View />
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Body */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            {/* Footer */}
            {showFooter && (
              <View style={styles.footer}>
                <Button
                  variant="outline"
                  onPress={handleCancel}
                  style={styles.footerButton}
                >
                  {cancelText}
                </Button>

                <View style={styles.footerSpacer} />

                <Button
                  variant="primary"
                  onPress={onConfirm || (() => {})}
                  loading={confirmLoading}
                  disabled={confirmDisabled || confirmLoading}
                  style={styles.footerButton}
                >
                  {confirmText}
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Containers
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  containerBottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  containerFull: {
    flex: 1,
  },

  // Content
  content: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    maxHeight: screenHeight * 0.9,
  },
  contentBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: screenHeight * 0.7,
  },
  contentFull: {
    flex: 1,
    borderRadius: 0,
    maxHeight: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.gray[500],
    lineHeight: 24,
  },

  // Body
  body: {
    maxHeight: screenHeight * 0.5,
  },
  bodyContent: {
    padding: spacing.lg,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  footerButton: {
    flex: 1,
  },
  footerSpacer: {
    width: spacing.md,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    width: '80%',
    maxWidth: 320,
  },
  md: {
    width: '90%',
    maxWidth: 480,
  },
  lg: {
    width: '95%',
    maxWidth: 640,
  },
  full: {
    width: '100%',
    flex: 1,
  },
});
