import React from 'react';
import { Droppable as OriginalDroppable } from '@hello-pangea/dnd';

// This is a simple wrapper around the original Droppable that doesn't try to connect to Redux
const CustomDroppable = (props) => {
  return <OriginalDroppable {...props} />;
};

export default CustomDroppable;
