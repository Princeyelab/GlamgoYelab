import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';

type InputType = 'text' | 'email' | 'password' | 'phone' | 'number';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: InputType;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  type = 'text',
  helperText,
  errorText,
  disabled = false,
  error = false,
  success = false,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const isSecure = type === 'password' && !showPassword;

  const getBorderColor = () => {
    if (error || errorText) return colors.error;
    if (success) return colors.success;
    if (isFocused) return colors.primary;
    return colors.gray[300];
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[
          styles.label,
          error && styles.labelError,
          disabled && styles.labelDisabled,
        ]}>
          {label}
        </Text>
      )}

      <View style={[
        styles.inputContainer,
        { borderColor: getBorderColor() },
        isFocused && styles.inputContainerFocused,
        disabled && styles.inputContainerDisabled,
      ]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            (rightIcon || type === 'password') ? styles.inputWithRightIcon : undefined,
            disabled ? styles.inputDisabled : undefined,
          ].filter(Boolean)}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={getKeyboardType()}
          secureTextEntry={isSecure}
          editable={!disabled}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={type === 'email' || type === 'password' ? false : true}
          {...props}
        />

        {type === 'password' ? (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.passwordToggle}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        ) : null}
      </View>

      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.error,
  },
  labelDisabled: {
    color: colors.gray[400],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderWidth: 2,
  },
  inputContainerDisabled: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[200],
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  inputDisabled: {
    color: colors.gray[500],
  },
  leftIconContainer: {
    paddingLeft: spacing.base,
    paddingRight: spacing.xs,
  },
  rightIconContainer: {
    paddingRight: spacing.base,
    paddingLeft: spacing.xs,
  },
  passwordToggle: {
    fontSize: 20,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
