import { NextRequest } from 'next/server';
import OpenGraphCard from '@/features/openGraph/components/openGraphCard/OpenGraphCard';
import { getUrlMetadata } from '@/features/cards/lib/dal';
import { truncateText } from '@/lib/utils/text';
import { getDomain } from '@/lib/utils/link';

export const runtime = 'edge';

interface Metadata {
  title?: string;
  url?: string;
  domain?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');

  let metadata: Metadata = {};
  if (url) {
    try {
      const result = await getUrlMetadata(url);
      metadata = {
        ...(result?.metadata || {}),
        domain: getDomain(url),
      };
    } catch (error) {
      console.error('Error fetching metadata:', error);
      metadata = {};
    }
  }

  const imageResponse = await OpenGraphCard({
    children: (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: '35px',
          }}
        >
          <p
            style={{
              fontSize: '40px',
              lineHeight: '20px',
              color: '#ff6400',
            }}
          >
            Semble
          </p>
          {metadata && (
            <p
              style={{
                fontSize: '64px',
                lineHeight: '20px',
              }}
            >
              {truncateText(
                metadata.title || metadata.url || metadata.domain || 'Unknown',
                25,
              )}
            </p>
          )}
        </div>
      </div>
    ),
  });

  return imageResponse;
}
