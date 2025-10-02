import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ProfileEmptyTab from './ProfileEmptyTab';
import { IoMdAlert } from 'react-icons/io';

const meta = {
  component: ProfileEmptyTab,
} satisfies Meta<typeof ProfileEmptyTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    message: 'A message that indicates this tab on profile has no content',
    icon: IoMdAlert,
  },
};
