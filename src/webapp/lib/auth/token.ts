export const isTokenExpiringSoon = (
  token: string | null | undefined,
): boolean => {
  if (!token) return true;

  const bufferSeconds = parseInt(
    process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY_BUFFER_SECONDS || '300',
    10,
  );

  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    );
    const expiry = payload.exp * 1000;
    const bufferTime = bufferSeconds * 1000;
    return Date.now() >= expiry - bufferTime;
  } catch {
    return true;
  }
};
