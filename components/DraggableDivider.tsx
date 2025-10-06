import React from 'react';

interface DraggableDividerProps {
  onDrag: (deltaX: number) => void;
}

export const DraggableDivider: React.FC<DraggableDividerProps> = ({ onDrag }) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      onDrag(moveEvent.movementX);
    };

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className="w-2 h-full cursor-col-resize flex-shrink-0 group"
      onMouseDown={handleMouseDown}
    >
      <div className="w-px h-full bg-stone-200 group-hover:bg-teal-400 transition-colors mx-auto"></div>
    </div>
  );
};
