import React from 'react';
import { NavalRocketExplosion } from './NavalRocketEffects';

interface MediumRocketExplosionProps {
  x: string | number;
  y: string | number;
  onComplete?: () => void;
  damage?: number;
}

export const MediumRocketExplosion: React.FC<MediumRocketExplosionProps> = ({
  x,
  y,
  onComplete,
  damage = 5000,
}) => {
  return (
    <NavalRocketExplosion
      tier="medium"
      x={x}
      y={y}
      damage={damage}
      onComplete={onComplete}
    />
  );
};

export default MediumRocketExplosion;
