'use client';

import { Button, createTheme, NavLink, TextInput } from '@mantine/core';

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
    stone: [
      '#fff1f5',
      '#ede6e7',
      '#d0cccd',
      '#b3b1b2',
      '#999999',
      '#8b8b8b',
      '#858484',
      '#747172',
      '#6a6365',
      '#605457',
    ],
    blue: [
      '#e3faff',
      '#cff0fe',
      '#a2dff8',
      '#72cdf3',
      '#4cbdef',
      '#35b4ed',
      '#23afed',
      '#109eda',
      '#0088be',
      '#0076a8',
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
    NavLink: NavLink.extend({
      styles: (theme) => ({
        root: { borderRadius: theme.radius.md },
        label: {
          fontSize: theme.fontSizes.md,
          fontWeight: 600,
        },
      }),
    }),
  },
});
