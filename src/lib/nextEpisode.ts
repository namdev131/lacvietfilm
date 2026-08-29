export type NextEpisodeState = {
  status: "idle" | "manual" | "counting" | "ready" | "cancelled";
  seconds: number;
};

const INITIAL_SECONDS = 10;

export function beginNextEpisode(hasNext: boolean, autoNext: boolean): NextEpisodeState {
  if (!hasNext) return { status: "idle", seconds: INITIAL_SECONDS };
  return { status: autoNext ? "counting" : "manual", seconds: INITIAL_SECONDS };
}

export function tickNextEpisode(state: NextEpisodeState): NextEpisodeState {
  if (state.status !== "counting") return state;
  const seconds = Math.max(0, state.seconds - 1);
  return { status: seconds === 0 ? "ready" : "counting", seconds };
}

export function cancelNextEpisode(): NextEpisodeState {
  return { status: "cancelled", seconds: INITIAL_SECONDS };
}
