'use client';

import { RichText } from '@atproto/api';
import Link from 'next/link';
import { Anchor, AnchorProps, Text, TextProps } from '@mantine/core';
import { getDomain } from '@/lib/utils/link';
import { Fragment } from 'react';

interface Props {
  text: string;
  linkProps?: Partial<AnchorProps>; // for mentions, links, hashtags
  textProps?: Partial<TextProps>; // for plain text
}

export default function RichTextRenderer({
  text,
  linkProps = {},
  textProps = {},
}: Props) {
  const richText = new RichText({ text });
  richText.detectFacetsWithoutResolution();

  return (
    <Fragment>
      {Array.from(richText.segments()).map((segment, i) => {
        // mentions
        if (segment.isMention()) {
          return (
            <Anchor
              component={Link}
              c={linkProps.c || 'blue'}
              fw={linkProps.fw || 500}
              href={`/profile/${segment.text.slice(1)}`}
              key={segment.mention?.did || `mention-${i}`}
              onClick={(e) => e.stopPropagation()}
              {...linkProps}
            >
              {segment.text}
            </Anchor>
          );
        }

        // links
        if (segment.isLink() && segment.link?.uri) {
          return (
            <Anchor
              component={Link}
              c={linkProps.c || 'blue'}
              fw={linkProps.fw || 500}
              href={segment.link.uri}
              target="_blank"
              key={segment.link.uri || `link-${i}`}
              onClick={(e) => e.stopPropagation()}
              {...linkProps}
            >
              {getDomain(segment.link.uri)}
            </Anchor>
          );
        }

        // hashtags
        if (segment.isTag()) {
          const encodedTag = encodeURIComponent(segment.tag?.tag || '');
          return (
            <Anchor
              component={Link}
              c={linkProps.c || 'blue'}
              fw={linkProps.fw || 500}
              href={`https://bsky.app/hashtag/${encodedTag}`}
              target="_blank"
              key={`tag-${i}`}
              onClick={(e) => e.stopPropagation()}
              {...linkProps}
            >
              {segment.text}
            </Anchor>
          );
        }

        // plain text
        return (
          <Text
            key={`text-${i}`}
            span
            c={textProps.c}
            fw={textProps.fw || 400}
            {...textProps}
          >
            {segment.text}
          </Text>
        );
      })}
    </Fragment>
  );
}
