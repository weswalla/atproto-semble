'use client';

import { Button, createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'tangerine',
  colors: {
    tangerine: [
      '#fff1e2',
      '#ffe1cc',
      '#ffc29a',
      '#ffa164',
      '#fe8537',
      '#fe731a',
      '#ff6400',
      '#e45800',
      '#cb4d00',
      '#b14000',
    ],
  },
  fontFamily:
    'Hanken Grotesk, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
  defaultRadius: 'md',
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'xl',
      },
    }),
  },
});
