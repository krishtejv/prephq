/**
 * Helper to recursively find a note by its ID in a tree structure.
 * @param {Array} list - The list of note nodes.
 * @param {string} id - The ID of the note to find.
 * @returns {Object|null} The found note object or null.
 */
export const findNoteRecursive = (list, id) => {
  if (!list) return null;
  for (let node of list) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNoteRecursive(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Helper to recursively delete a note by its ID in a tree structure.
 * @param {Array} list - The list of note nodes.
 * @param {string} id - The ID of the note to delete.
 * @returns {boolean} True if the note was successfully deleted, false otherwise.
 */
export const deleteNoteRecursive = (list, id) => {
  if (!list) return false;
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list.splice(i, 1);
      return true;
    }
    if (list[i].children && list[i].children.length > 0) {
      const deleted = deleteNoteRecursive(list[i].children, id);
      if (deleted) return true;
    }
  }
  return false;
};

/**
 * Helper to recursively find the parent note of a child node ID.
 * @param {Array} list - The list of note nodes.
 * @param {string} childId - The ID of the child note.
 * @returns {Object|null} The found parent note object or null.
 */
export const findParentNoteRecursive = (list, childId) => {
  if (!list) return null;
  for (let node of list) {
    if (node.children && node.children.length > 0) {
      if (node.children.some(child => child.id === childId)) {
        return node;
      }
      const found = findParentNoteRecursive(node.children, childId);
      if (found) return found;
    }
  }
  return null;
};

