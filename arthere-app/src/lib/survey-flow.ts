// Pure step-machine logic for the PDX Community Survey. Extracted from
// SurveyForm so the branching can be unit-tested without rendering.

import { NOT_MAKING_ART } from './survey-constants';

export type StepId =
  | 'location'
  | 'about-you'
  | 'about-you-art'
  | 'art-medium'
  | 'portland-familiarity'
  | 'discovery'
  | 'portland-detail'
  | 'career-stage'
  | 'practice'
  | 'practice-goals'
  | 'involvement'
  | 'email'
  | 'learned-about'
  | 'done';

export interface FlowAnswers {
  artistStatus: string;
}

export function isMakingArt(a: FlowAnswers): boolean {
  return a.artistStatus !== NOT_MAKING_ART && a.artistStatus !== '';
}

export function getNextStep(step: StepId, a: FlowAnswers): StepId {
  switch (step) {
    case 'location':
      return 'about-you';
    case 'about-you':
      return 'about-you-art';
    case 'about-you-art':
      return isMakingArt(a) ? 'art-medium' : 'portland-familiarity';
    case 'art-medium':
      return 'portland-familiarity';
    case 'portland-familiarity':
      return 'discovery';
    case 'discovery':
      return 'portland-detail';
    case 'portland-detail':
      return isMakingArt(a) ? 'career-stage' : 'involvement';
    case 'career-stage':
      return 'practice';
    case 'practice':
      return 'practice-goals';
    case 'practice-goals':
      return 'involvement';
    case 'involvement':
      return 'email';
    case 'email':
      return 'learned-about';
    case 'learned-about':
    case 'done':
      return 'done';
  }
}

export function getFullPath(a: FlowAnswers): StepId[] {
  const path: StepId[] = ['location'];
  let current: StepId = 'location';
  while (current !== 'done') {
    current = getNextStep(current, a);
    path.push(current);
  }
  return path;
}
