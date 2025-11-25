// components/keyboard-aware-container.tsx
import React, { ReactNode } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableWithoutFeedback,
    ViewStyle,
} from 'react-native';

interface KeyboardAwareContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  scrollEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardVerticalOffset?: number;
  dismissKeyboardOnTap?: boolean;
}

/**
 * Container che gestisce automaticamente la tastiera
 * 
 * Features:
 * - Solleva il contenuto quando la tastiera appare
 * - Permette di chiudere la tastiera tappando fuori
 * - Permette di scrollare quando la tastiera è aperta
 * - Supporta swipe down per chiudere tastiera
 */
export function KeyboardAwareContainer({
  children,
  style,
  scrollEnabled = true,
  showsVerticalScrollIndicator = false,
  keyboardVerticalOffset = 0,
  dismissKeyboardOnTap = true,
}: KeyboardAwareContainerProps) {
  const content = dismissKeyboardOnTap ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  ) : (
    children
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, style]}
      keyboardVerticalOffset={keyboardVerticalOffset}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        // ✅ Questa proprietà permette di chiudere la tastiera con swipe down
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});