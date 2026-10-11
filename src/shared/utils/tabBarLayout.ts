export const TAB_BAR_HEIGHT = 78;
export const TAB_BAR_TOP_PADDING = 10;

export const getTabBarBottomPadding = (bottomInset: number, platform: string) => (
  Math.max(bottomInset, platform === 'ios' ? 22 : 14)
);

export const getTabBarOccupiedHeight = (bottomInset: number, platform: string) => (
  TAB_BAR_HEIGHT + TAB_BAR_TOP_PADDING + getTabBarBottomPadding(bottomInset, platform)
);
