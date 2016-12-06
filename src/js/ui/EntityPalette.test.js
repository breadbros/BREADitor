/*eslint no-undef: 1*/
import { currentEntities, update_entity, setCurrentEntities } from './EntityPalette';

beforeEach(() => {
  setCurrentEntities([]);
});

test('update_entity doesnt overwrite unspecified variables', () => {
  setCurrentEntities([{'this_key_cannot': 'possibly_exist', 'tx': 9999}]);
  window.$$$currentMap = { createEntityRenderData: () => {} }; // STUB

  update_entity(null, 0);

  expect(currentEntities[0].tx).toEqual('');
  expect(currentEntities[0].this_key_cannot, 'possibly_exist');
});
