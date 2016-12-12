/*eslint no-undef: 1*/
import { getCurrentEntities, _update_entity_inner, setCurrentEntities } from './EntityPalette';

let vals = null;
let state = null;
beforeEach(() => {
  setCurrentEntities([]);
  vals = {};
  vals.entity_speed = 1234;

  state = window.$$$currentMap;
  window.$$$currentMap = { createEntityRenderData: () => {} }; // STUB
});

afterEach(()=>{
  window.$$$currentMap = state;
});

test('update_entity doesnt overwrite unknown variables (but does overwrite known variables)', () => {
  setCurrentEntities([{
    'this_key_cannot_possibly_exist_in_the_dialog': '(and should be preserved)',
    'location': {
      'tx': 9999
    }
  }]);

  expect(getCurrentEntities()[0].location.tx).toEqual(9999);

  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].location.tx).toBeUndefined();
  expect(getCurrentEntities()[0].this_key_cannot_possibly_exist_in_the_dialog, '(and should be preserved)');
});
