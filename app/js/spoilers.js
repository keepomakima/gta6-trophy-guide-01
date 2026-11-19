// spoilers: while the spoiler setting is on, a story trophy that has not been
// earned yet shows a mask instead of its name and description. Earning it (or
// switching the setting off) reveals it. Non-story trophies are never masked.

export function isSpoilerHidden(trophy, earned, spoilerOn) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

export const SPOILER_MASK_NAME = 'Hidden story trophy';
export const SPOILER_MASK_DESC = 'Name and description hidden until earned — turn the spoiler setting off, or tick it earned, to reveal this trophy.';
