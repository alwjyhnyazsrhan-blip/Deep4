import React from 'react';
import { NavalRocketExplosion } from './NavalRocketEffects';

interface LargeRocketExplosionProps {
  x: string | number;
  y: string | number;
  onComplete?: () => void;
  damage?: number;
}

export const LargeRocketExplosion: React.FC<LargeRocketExplosionProps> = ({
  x,
  y,
  onComplete,
  damage = 10000,
}) => {
  return (
    <NavalRocketExplosion
      tier="large"
      x={x}
      y={y}
      damage={damage}
      onComplete={onComplete}
    />
  );
};

export default LargeRocketExplosion;
