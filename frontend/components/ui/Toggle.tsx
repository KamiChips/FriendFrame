import React from 'react';
import { Switch, SwitchProps, useColorScheme } from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

interface CustomSwitchProps extends SwitchProps {}

export function Toggle({ value, onValueChange, ...props }: CustomSwitchProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

    return (
        <SafeAreaProvider>
            <SafeAreaView>
                <Switch
                    {...props}
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{
                        false: isDark ? '#3F3F46' : '#E5E5E5',
                        true: isDark ? '#AA3E14' : '#34C2DD'
                    }}
                    thumbColor="#FFF"
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}