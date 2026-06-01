export async function setupPushHandler(): Promise<void> {
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {}
}

export async function onPushNotificationTap(
  callback: (notification: any) => void,
): Promise<() => void> {
  try {
    const Notifications = await import("expo-notifications");
    const sub = Notifications.addNotificationResponseReceivedListener((res) =>
      callback(res.notification),
    );
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
