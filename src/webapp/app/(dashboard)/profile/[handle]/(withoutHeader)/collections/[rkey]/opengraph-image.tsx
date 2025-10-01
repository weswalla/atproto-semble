import { ApiClient } from '@/api-client';
import { createClientTokenManager } from '@/services/auth';
import OpenGraphCard from '@/features/openGraph/components/openGraphCard/OpenGraphCard';
import { truncateText } from '@/lib/utils/text';

interface Props {
  params: Promise<{ collectionId: string }>;
}

export const contentType = 'image/png';
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image(props: Props) {
  const { collectionId } = await props.params;

  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const collection = await apiClient.getCollectionPage(collectionId);

  return await OpenGraphCard({
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
              color: '#e803ff',
            }}
          >
            Collection
          </p>
          <p
            style={{
              fontSize: '64px',
              lineHeight: '20px',
            }}
          >
            {truncateText(truncateText(collection.name), 35)}
          </p>
          <p
            style={{
              fontSize: '40px',
              lineHeight: '20px',
              marginTop: '40px',
            }}
          >
            <span>By&nbsp;</span>
            <span style={{ color: '#23AFED' }}>
              @{truncateText(truncateText(collection.author.handle), 35)}
            </span>
          </p>
        </div>
      </div>
    ),
  });
}
