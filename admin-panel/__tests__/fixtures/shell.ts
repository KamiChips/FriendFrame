import type { ShellProps } from "@/components/layout/AppShell";

// datos de ejemplo tomados del diseno; solo para pruebas
export function buildShell(overrides: Partial<ShellProps> = {}): ShellProps {
  return {
    currentUser: { handle: "@admin", initials: "A", role: "admin" as const },
    sectionCounts: { reports: 23 },
    onNavigate: jest.fn(),
    onSignOut: jest.fn(),
    ...overrides,
  };
}
