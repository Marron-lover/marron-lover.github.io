const readOnly = () => {
  throw new Error("This published travel collection is read-only.");
};
export const addLocalCountry = readOnly,
  deleteHiddenLocalCountries = readOnly,
  reloadAfterLocalSave = readOnly,
  searchLocalCountries = readOnly,
  updateLocalEditorState = readOnly,
  deleteHiddenLocalMedia = readOnly,
  importLocalMedia = readOnly,
  uploadLocalMedia = readOnly,
  addLocalTravelRecord = readOnly,
  searchLocalCities = readOnly;
