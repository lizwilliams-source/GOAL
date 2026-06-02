import React from 'react';
import { AnimalKind } from '../types';

interface Props {
  animal: AnimalKind;
  size?: number;
  className?: string;
}

export const ANIMAL_NAMES: Record<AnimalKind, string> = {
  duck:    'Duck',
  goat:    'Goat',
  panda:   'Panda',
  giraffe: 'Giraffe',
  cat:     'Cat',
  gorilla: 'Gorilla',
  sheep:   'Sheep',
  tiger:   'Tiger',
  cheetah: 'Cheetah',
  lizard:  'Lizard',
};

export const ALL_ANIMALS: AnimalKind[] = [
  'duck','goat','panda','giraffe','cat',
  'gorilla','sheep','tiger','cheetah','lizard',
];

export default function AnimalAvatar({ animal, size = 80, className = '' }: Props) {
  return (
    <img
      src={`/animals/${animal}.png`}
      alt={ANIMAL_NAMES[animal]}
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
