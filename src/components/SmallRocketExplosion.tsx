import React from 'react';
import { NavalRocketExplosion } from './NavalRocketEffects';

interface SmallRocketExplosionProps {
  x: string | number;
  y: string | number;
  onComplete?: () => void;
  damage?: number;
}

export const SmallRocketExplosion: React.FC<SmallRocketExplosionProps> = ({
  x,
  y,
  onComplete,
  damage = 1000,
}) => {
  return (
    <NavalRocketExplosion
      tier="small"
      x={x}
      y={y}
      damage={damage}
      onComplete={onComplete}
    />
  );
};

export default SmallRocketExplosion;
