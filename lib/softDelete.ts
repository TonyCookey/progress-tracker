export function notDeleted(includeArchived: boolean) {
  return includeArchived ? {} : { deletedAt: null };
}
