export const isTokenExpiringSoon = (
  token: string | null | undefined,
): boolean => {
  if (!token) return true;

  const bufferSeconds = parseInt(
    process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY_BUFFER_SECONDS || '300',
    10,
  );

  try {
    // Validate JWT structure first
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString(),
    );
    
    // Ensure exp claim exists and is a number
    if (!payload.exp || typeof payload.exp !== 'number') return true;
    
    const expiry = payload.exp * 1000;
    const bufferTime = bufferSeconds * 1000;
    return Date.now() >= expiry - bufferTime;
  } catch {
    return true;
  }
};
