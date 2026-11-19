import { View } from "react-native";

const block = "bg-line-light dark:bg-line-dark";

// fila de tabla mientras cargan los datos: avatar, dos lineas de texto y un chip
export function SkeletonRow() {
  return (
    <View accessibilityLabel="Cargando" className="h-9 flex-row items-center gap-4">
      <View className={`h-9 w-9 rounded-full ${block}`} />
      <View className="w-[200px] gap-2">
        <View className={`h-3 w-[170px] rounded ${block}`} />
        <View className={`h-2.5 w-[110px] rounded ${block}`} />
      </View>
      <View className={`h-6 w-[100px] rounded-full ${block}`} />
    </View>
  );
}
