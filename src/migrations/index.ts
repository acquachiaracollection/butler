import * as migration_20260514_132908 from './20260514_132908';
import * as migration_20260515_140318 from './20260515_140318';

export const migrations = [
  {
    up: migration_20260514_132908.up,
    down: migration_20260514_132908.down,
    name: '20260514_132908',
  },
  {
    up: migration_20260515_140318.up,
    down: migration_20260515_140318.down,
    name: '20260515_140318'
  },
];
