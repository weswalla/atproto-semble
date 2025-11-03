export const isTokenExpiringSoon = (
  token: string | null | undefined,
  bufferMinutes: number = 5,
): boolean => {
  if (!token) return true;

  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    );
    const expiry = payload.exp * 1000;
    const bufferTime = bufferMinutes * 60 * 1000;
    return Date.now() >= expiry - bufferTime;
  } catch {
    return true;
  }
};
