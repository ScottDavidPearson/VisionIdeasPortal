// Initial state for the admin section
const initialState = {
  // Add any admin-specific state here
  columns: {
    // This will store the columns and their items
    // Example structure:
    // 'column-1': {
    //   id: 'column-1',
    //   title: 'To Do',
    //   items: []
    // }
  },
  columnOrder: [] // To maintain the order of columns
};

const adminReducer = (state = initialState, action) => {
  switch (action.type) {
    // Add your action types and reducers here
    // Example:
    // case 'MOVE_ITEM':
    //   return {
    //     ...state,
    //     // Update state based on action
    //   };
    default:
      return state;
  }
};

export default adminReducer;
