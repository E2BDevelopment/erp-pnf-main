export function shouldRefreshAuthRoute(
  event: string,
  eventUserId: string | null,
  currentUserId: string | null,
) {
  return (
    event !== "TOKEN_REFRESHED" &&
    !(event === "SIGNED_IN" && eventUserId !== null && eventUserId === currentUserId)
  );
}
