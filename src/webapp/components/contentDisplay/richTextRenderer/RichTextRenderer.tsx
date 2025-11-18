'use client';

import { RichText } from '@atproto/api';
import Link from 'next/link';
import { Anchor, AnchorProps, Text, TextProps } from '@mantine/core';
import { getDomain } from '@/lib/utils/link';

interface Props {
  text: string;
  linkProps?: Partial<AnchorProps>;
  textProps?: Partial<TextProps>;
}

export default function RichTextRenderer({
  text,
  linkProps = {},
  textProps = {},
}: Props) {
  const richText = new RichText({ text });
  richText.detectFacetsWithoutResolution();

  return (
    <Text span {...textProps}>
      {Array.from(richText.segments()).map((segment, i) => {
        // Mentions
        if (segment.isMention()) {
          return (
            <Anchor
              key={`mention-${i}`}
              href={`/profile/${segment.text.slice(1)}`}
              c={linkProps.c || 'blue'}
              fw={linkProps.fw || 500}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              {...linkProps}
            >
              {segment.text}
            </Anchor>
          );
        }

        // Links
        if (segment.isLink() && segment.link?.uri) {
          return (
            <Anchor
              key={`link-${i}`}
              href={segment.link.uri}
              c={linkProps.c || 'blue'}
              fw={linkProps.fw || 500}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              {...linkProps}
            >
              {getDomain(segment.link.uri)}
            </Anchor>
          );
        }

        // Hashtags
        if (segment.isTag()) {
          const encodedTag = encodeURIComponent(segment.tag?.tag || '');
          return (
            <Anchor
              key={`tag-${i}`}
              component={Link}
              c={linkProps.c || 'blue'}
              fw={linkProps.fw || 500}
              href={`https://bsky.app/hashtag/${encodedTag}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              {...linkProps}
            >
              {segment.text}
            </Anchor>
          );
        }

        // Plain text
        return <span key={`text-${i}`}>{segment.text}</span>;
      })}
    </Text>
  );
}
