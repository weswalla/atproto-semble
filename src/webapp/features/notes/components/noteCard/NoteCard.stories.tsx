import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import NoteCard from './NoteCard';

const meta = {
  component: NoteCard,
} satisfies Meta<typeof NoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    note: `This is the note's content`,
    author: {
      id: 'id',
      name: 'name',
      handle: 'handle',
      avatarUrl: 'avatar url',
      description: 'description',
    },
    id: 'note id',
    createdAt: '2025',
  },
};
