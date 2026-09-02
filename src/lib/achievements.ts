export const ACHIEVEMENTS = [
  {
    key: "first-finish",
    title: "Khởi đầu trọn vẹn",
    description: "Xem xong nội dung đầu tiên.",
    target: 1,
  },
  {
    key: "ten-finishes",
    title: "Mọt phim",
    description: "Xem xong 10 nội dung.",
    target: 10,
  },
  {
    key: "five-watch-days",
    title: "Khán giả thân quen",
    description: "Xem xong nội dung trong 5 ngày khác nhau.",
    target: 5,
  },
  {
    key: "series-complete",
    title: "Trọn bộ",
    description: "Xem đến tập cuối của một bộ phim.",
    target: 1,
  },
] as const;

export type AchievementKey = (typeof ACHIEVEMENTS)[number]["key"];

export function achievementProgress(
  finishCount: number,
  watchDayCount: number,
  unlockedKeys: ReadonlySet<string>,
) {
  return ACHIEVEMENTS.map((definition) => {
    const progress =
      definition.key === "first-finish"
        ? Math.min(finishCount, 1)
        : definition.key === "ten-finishes"
          ? Math.min(finishCount, 10)
          : definition.key === "five-watch-days"
            ? Math.min(watchDayCount, 5)
            : unlockedKeys.has(definition.key)
              ? 1
              : 0;
    return {
      definition,
      progress,
      unlocked: unlockedKeys.has(definition.key),
    };
  });
}
