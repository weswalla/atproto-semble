import OpenGraphCard from '@/features/openGraph/components/openGraphCard/OpenGraphCard';
import { getProfile } from '@/features/profile/lib/dal';
import { truncateText } from '@/lib/utils/text';

interface Props {
  params: Promise<{ handle: string }>;
}

export const contentType = 'image/png';
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image(props: Props) {
  const { handle } = await props.params;
  const profile = await getProfile(handle);

  return await OpenGraphCard({
    children: (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {profile.avatarUrl && (
          <img
            src={profile.avatarUrl}
            width={164}
            height={164}
            alt={`${handle}'s avatar`}
            style={{ borderRadius: '20px', marginTop: 'auto' }}
          />
        )}
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
              fontSize: '64px',
              lineHeight: '20px',
            }}
          >
            {truncateText(profile.name, 20)}
          </p>
          <p
            style={{
              fontSize: '40px',
              lineHeight: '20px',
              color: '#23AFED',
            }}
          >
            @{truncateText(truncateText(profile.handle), 35)}
          </p>
        </div>
      </div>
    ),
  });
}
