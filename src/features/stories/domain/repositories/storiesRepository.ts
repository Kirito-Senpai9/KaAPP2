import type {
  Story,
  StoryPrivacyLists,
  StoryPrivacyPerson,
} from '@/features/stories/domain/entities/story';

export interface StoriesRepository {
  getStories(): Story[];
  saveStories(stories: Story[]): void;
  deleteStory(ownerId: string, storyId: string): Story[];
  getPrivacyLists(ownerId: string): StoryPrivacyLists;
  savePrivacyLists(ownerId: string, lists: StoryPrivacyLists): void;
  getPrivacyDirectory(ownerId: string): StoryPrivacyPerson[];
}
