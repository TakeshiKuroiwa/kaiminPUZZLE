import React from 'react';
import type { BlockData } from '../types';

interface BlockProps {
  block: BlockData;
  onClick: (x: number, y: number) => void;
}

export const Block: React.FC<BlockProps> = ({ block, onClick }) => {
  if (block.isEmpty) {
    return <div className="block empty" />;
  }

  // Determine CSS classes based on state
  let className = `block color-${block.color}`;
  if (block.isRemoving) className += ' removing';
  if (block.isFalling) className += ' falling';

  if (block.type === 'rainbow') className += ' rainbow';
  if (block.type === 'kaimin') className += ' kaimin';

  // Render faces/characters based on type
  let face = '';
  if (block.type === 'kaimin') {
      face = '🐑';
  }

  return (
    <div 
      className={className} 
      onClick={() => onClick(block.x, block.y)}
    >
      <span className="face">{face}</span>
    </div>
  );
};
