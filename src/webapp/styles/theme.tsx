'use client';

import {
  Avatar,
  Button,
  CheckboxIndicator,
  createTheme,
  MenuItem,
  NavLink,
} from '@mantine/core';

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
    grape: [
      '#ffe8ff',
      '#fdceff',
      '#f79bff',
      '#f164ff',
      '#ec36ff',
      '#ea25ff',
      '#e803ff',
      '#ce00e4',
      '#b800cc',
      '#a000b3',
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
    Avatar: Avatar.extend({
      defaultProps: {
        radius: 'md',
      },
    }),
    MenuItem: MenuItem.extend({
      defaultProps: {
        fz: 'md',
        fw: 600,
      },
    }),
    CheckboxIndicator: CheckboxIndicator.extend({
      defaultProps: {
        radius: 'xl',
      },
    }),
  },
});
