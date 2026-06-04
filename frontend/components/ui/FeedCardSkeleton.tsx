import React, { useEffect, useRef } from "react";
import { View, Animated, useColorScheme } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

function SkeletonBox ({ style, pulse }: {style?: object; pulse: Animated.Value}) {
    const isDark = useColorScheme() === "dark";

    const bg = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: isDark
            ? ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.13)"]
            : ["rgba(0,0,0,0.07)", "rgba(0,0,0,0.13)"],
    });

    return <Animated.View style={[{ backgroundColor: bg as any}, style]} />;
}

export default function FeedCardSkeleton() {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false}),
                Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false}),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [pulse]);

    return (
        <View className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-transparent dark:bg-background-semidark">
            {/* Header */}
            <View className="flex-row items-start p-4">
                <SkeletonBox pulse={pulse} style={{ width: 48, height: 48, borderRadius: 24 }} />
                <View className="ml-3 flex-1 gap-y-2">
                    <SkeletonBox pulse={pulse} style={{ height: 14, width: "50%", borderRadius: 6 }}/>
                    <SkeletonBox pulse={pulse} style={{ height: 11, width: "28%", borderRadius: 6 }}/>
                    <SkeletonBox pulse={pulse} style={{ height: 11, width: "65%", borderRadius: 6 }}/>
                </View>
            </View>

            {/* Lineas de contenido */}
            <View className="px-4 pb-3 gap-y-2">
                <SkeletonBox pulse={pulse} style={{ height: 13, width: "100%", borderRadius: 6 }}/>
                <SkeletonBox pulse={pulse} style={{ height: 13, width: "90%", borderRadius: 6 }}/>
                <SkeletonBox pulse={pulse} style={{ height: 13, width: "70%", borderRadius: 6 }}/>
            </View>

            {/* Image placeholder */}
            <SkeletonBox pulse={pulse} style={{ width: "100%", height: 200 }}/>

            {/* Footer */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 24 }}>
                <SkeletonBox pulse={pulse} style={{ height: 20, width: 52, borderRadius: 6 }}/>
                <SkeletonBox pulse={pulse} style={{ height: 20, width: 52, borderRadius: 6 }}/>
                <SkeletonBox pulse={pulse} style={{ height: 20, width: 52, borderRadius: 6 }}/>
            </View>
        </View>
    );
}

export function FeedSkeletonList({ count = 4 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <FeedCardSkeleton key={`skeleton-${i}`} />
            ))}
        </>
    );
}