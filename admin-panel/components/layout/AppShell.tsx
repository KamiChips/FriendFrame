import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import type { SectionKey } from "@/constants/navigation";

import { PageHeader } from "./PageHeader";
import { Sidebar, type SidebarProps } from "./Sidebar";

// lo que cada pantalla recibe para pintar la navegacion comun
export type ShellProps = Omit<SidebarProps, "activeSection">;

export interface AppShellProps extends ShellProps {
  activeSection?: SectionKey;
  breadcrumb: string;
  title: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  activeSection,
  breadcrumb,
  title,
  headerActions,
  children,
  ...sidebarProps
}: AppShellProps) {
  return (
    <View className="min-h-screen flex-1 flex-row bg-canvas-light dark:bg-canvas-dark">
      <Sidebar activeSection={activeSection} {...sidebarProps} />
      <View className="flex-1">
        <PageHeader breadcrumb={breadcrumb} title={title}>
          {headerActions}
        </PageHeader>
        {/* sin indicador para que el contenido conserve el ancho del diseno */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-5 px-8 py-6"
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
