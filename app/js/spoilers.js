/** The spoiler rule: story trophies stay masked until earned, when the setting is on. */
export function isSpoilerHidden(trophy, spoilersOn, earned) {
  return spoilersOn && trophy.kind === 'story' && !earned;
}

/** The masked name shown for a hidden story trophy. */
export function spoilerName() {
  return 'Hidden story trophy';
}

/** The masked description shown for a hidden story trophy. */
export function spoilerDescription() {
  return 'Earn this trophy in the story to reveal its name and description.';
}
