import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  Story,
  StoryPrivacyLists,
  StoryPrivacyPerson,
  StoryPrivacyPreset,
} from '@/features/stories/domain/entities/story';
import { getStoriesRepository } from '@/features/stories/infrastructure/repositories/mockStoriesRepository';

const EMPTY_PRIVACY_LISTS: StoryPrivacyLists = {
  everyoneExceptions: [],
  contactsExceptions: [],
  closeFriends: [],
  selectedPeople: [],
};

const PRESET_TO_LIST_KEY = {
  everyone: 'everyoneExceptions',
  contacts: 'contactsExceptions',
  close_friends: 'closeFriends',
  selected_people: 'selectedPeople',
} as const;

type UseStoryPrivacyEditorParams = {
  visible: boolean;
  ownerId: string | null;
  storyId: string | null;
  initialPreset: StoryPrivacyPreset | null;
};

function clonePeople(people: StoryPrivacyPerson[]) {
  return people.map((person) => ({ ...person }));
}

function cloneLists(lists: StoryPrivacyLists): StoryPrivacyLists {
  return {
    everyoneExceptions: clonePeople(lists.everyoneExceptions),
    contactsExceptions: clonePeople(lists.contactsExceptions),
    closeFriends: clonePeople(lists.closeFriends),
    selectedPeople: clonePeople(lists.selectedPeople),
  };
}

function sortPeopleBySelection(
  people: StoryPrivacyPerson[],
  selectedIds: Set<string>
) {
  return [...people].sort((left, right) => {
    const leftSelected = selectedIds.has(left.id);
    const rightSelected = selectedIds.has(right.id);

    if (leftSelected !== rightSelected) {
      return leftSelected ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

export function useStoryPrivacyEditor({
  visible,
  ownerId,
  storyId,
  initialPreset,
}: UseStoryPrivacyEditorParams) {
  const repository = useMemo(() => getStoriesRepository(), []);
  const queryClient = useQueryClient();
  const [draftPreset, setDraftPreset] = useState<StoryPrivacyPreset>('everyone');
  const [draftLists, setDraftLists] = useState<StoryPrivacyLists>(
    EMPTY_PRIVACY_LISTS
  );
  const [activeEditorPreset, setActiveEditorPreset] =
    useState<StoryPrivacyPreset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const availablePeople = useMemo(
    () => (ownerId ? repository.getPrivacyDirectory(ownerId) : []),
    [ownerId, repository]
  );

  useEffect(() => {
    if (!visible || !ownerId || !storyId) {
      setActiveEditorPreset(null);
      setSearchQuery('');
      return;
    }

    const cachedStories = queryClient.getQueryData<Story[]>(['stories']);
    const storyUsers = cachedStories ?? repository.getStories();
    const ownerStories = storyUsers.find((storyUser) => storyUser.id === ownerId);
    const currentStory = ownerStories?.stories.find((story) => story.id === storyId);

    setDraftPreset(currentStory?.privacyPreset ?? initialPreset ?? 'everyone');
    setDraftLists(cloneLists(repository.getPrivacyLists(ownerId)));
    setActiveEditorPreset(null);
    setSearchQuery('');
  }, [initialPreset, ownerId, queryClient, repository, storyId, visible]);

  const selectedPeopleForEditor = useMemo(() => {
    if (!activeEditorPreset) {
      return [];
    }

    return draftLists[PRESET_TO_LIST_KEY[activeEditorPreset]];
  }, [activeEditorPreset, draftLists]);

  const selectedPeopleIds = useMemo(
    () => new Set(selectedPeopleForEditor.map((person) => person.id)),
    [selectedPeopleForEditor]
  );

  const filteredPeople = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const people = normalizedSearch
      ? availablePeople.filter((person) =>
          person.name.toLowerCase().includes(normalizedSearch)
        )
      : availablePeople;

    return sortPeopleBySelection(people, selectedPeopleIds);
  }, [availablePeople, searchQuery, selectedPeopleIds]);

  const listCounts = useMemo(
    () => ({
      everyone: draftLists.everyoneExceptions.length,
      contacts: draftLists.contactsExceptions.length,
      close_friends: draftLists.closeFriends.length,
      selected_people: draftLists.selectedPeople.length,
    }),
    [draftLists]
  );

  const openEditor = useCallback((preset: StoryPrivacyPreset) => {
    setActiveEditorPreset(preset);
    setSearchQuery('');
  }, []);

  const closeEditor = useCallback(() => {
    setActiveEditorPreset(null);
    setSearchQuery('');
  }, []);

  const togglePerson = useCallback(
    (person: StoryPrivacyPerson) => {
      if (!activeEditorPreset) {
        return;
      }

      const listKey = PRESET_TO_LIST_KEY[activeEditorPreset];

      setDraftLists((currentLists) => {
        const currentList = currentLists[listKey];
        const alreadyIncluded = currentList.some(
          (currentPerson) => currentPerson.id === person.id
        );

        const nextList = alreadyIncluded
          ? currentList.filter((currentPerson) => currentPerson.id !== person.id)
          : [...currentList, person];

        return {
          ...currentLists,
          [listKey]: sortPeopleBySelection(nextList, new Set(nextList.map((item) => item.id))),
        };
      });
    },
    [activeEditorPreset]
  );

  const saveChanges = useCallback(() => {
    if (!ownerId || !storyId) {
      return false;
    }

    const currentStories =
      queryClient.getQueryData<Story[]>(['stories']) ?? repository.getStories();

    const nextStories = currentStories.map((storyUser) => {
      if (storyUser.id !== ownerId) {
        return storyUser;
      }

      return {
        ...storyUser,
        stories: storyUser.stories.map((story) =>
          story.id === storyId ? { ...story, privacyPreset: draftPreset } : story
        ),
      };
    });

    repository.saveStories(nextStories);
    repository.savePrivacyLists(ownerId, draftLists);
    queryClient.setQueryData(['stories'], nextStories);

    return true;
  }, [draftLists, draftPreset, ownerId, queryClient, repository, storyId]);

  return {
    activeEditorPreset,
    availablePeople,
    closeEditor,
    draftPreset,
    filteredPeople,
    listCounts,
    openEditor,
    saveChanges,
    searchQuery,
    selectedPeopleIds,
    setDraftPreset,
    setSearchQuery,
    togglePerson,
  };
}
