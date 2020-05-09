/*eslint no-undef: 1*/
import { getCurrentEntities, _update_entity_inner, setCurrentEntities } from './EntityPalette';

jest.mock('./Util.js')

let vals = null;
let state = null;
beforeEach(() => {
  setCurrentEntities([]);
  vals = {};
  vals.entity_speed = 1234;

  state = window.$$$currentMap;
  window.$$$currentMap = { createEntityRenderData: () => {}, resetEntityData: () => {} }; // STUB
});

afterEach(()=>{
  window.$$$currentMap = state;
});

test('update_entity doesnt overwrite unknown variables', () => {
  setCurrentEntities([{
    'this_key_cannot_possibly_exist_in_the_dialog': '(and should be preserved)',
  }]);

  expect(getCurrentEntities()[0].this_key_cannot_possibly_exist_in_the_dialog, '(and should be preserved)');
});

test('update_entity mutates loc_tx', () => {
  setCurrentEntities([{
    'location': {
      'tx': 9999
    }
  }]);

  vals.loc_tx = 345;
  vals.loc_ty = 0;
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].location.tx).toEqual(345);
});

test('update_entity mutates loc_ty', () => {
  setCurrentEntities([{
    'location': {
      'ty': 9999
    }
  }]);

  vals.loc_tx = 0;
  vals.loc_ty = 666;
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].location.ty).toEqual(666);
});

test('update_entity mutates loc_px', () => {
  setCurrentEntities([{
    'location': {
      'px': 9999
    }
  }]);

  vals.loc_py = 0;
  vals.loc_px = 555;
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].location.px).toEqual(555);
});

test('update_entity mutates loc_py', () => {
  setCurrentEntities([{
    'location': {
      'py': 9999
    }
  }]);

  vals.loc_px = 0;
  vals.loc_py = 444;
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].location.py).toEqual(444);
});

test('update_entity mutates loc_l', () => {
  setCurrentEntities([{
    'location': {
      'layer': 9999
    }
  }]);

  vals.loc_l = 333;
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].location.layer).toEqual(333);
});

test('update_entity mutates animation', () => {
  setCurrentEntities([{
    'animation': 'jiggy'
  }]);

  vals.entity_animation = 'stodgy';
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].animation).toEqual('stodgy');
});

test('update_entity mutates facing', () => {
  setCurrentEntities([{
    'facing': 'left'
  }]);

  vals.entity_animation = 'right';
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].animation).toEqual('right');
});

test('update_entity mutates wander', () => {
  setCurrentEntities([{
    'wander': 'drunkenly'
  }]);

  vals.entity_animation = 'soberly';
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].animation).toEqual('soberly');
});

test('update_entity mutates name', () => {
  setCurrentEntities([{
    'name': 'bob'
  }]);

  vals.entity_animation = 'fred';
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].animation).toEqual('fred');
});

test('update_entity mutates filename', () => {
  setCurrentEntities([{
    'filename': 'c://butts.json'
  }]);

  vals.entity_filename = 'c://definitely-not-butts.json';
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].filename).toEqual('c://definitely-not-butts.json');
});

test('update_entity mutates activation_script', () => {
  setCurrentEntities([{
    'activation_script': 'do_a_little_dance'
  }]);

  vals.entity_activation_script = 'make_a_little_love';
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].activation_script).toEqual('make_a_little_love');
});

test('update_entity mutates speed', () => {

  setCurrentEntities([{
    'speed': 'way fast'
  }]);

  vals.entity_speed = 12;
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].speed).toEqual(12);
});

test('update_entity mutates pays_attention_to_obstructions', () => {

  setCurrentEntities([{
    'pays_attention_to_obstructions': 'taco'
  }]);

  vals.entity_pays_attention_to_obstructions = 'burrito';
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].pays_attention_to_obstructions).toEqual('burrito');
});

test('update_entity mutates is_an_obstruction', () => {

  setCurrentEntities([{
    'is_an_obstruction': 'taco'
  }]);

  vals.entity_is_an_obstruction = 'burrito';
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].is_an_obstruction).toEqual('burrito');
});

test('update_entity mutates autoface', () => {

  setCurrentEntities([{
    'autofaces': 'taco'
  }]);

  vals.entity_autofaces = 'burrito';

  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].autofaces).toEqual('burrito');
});


test('update_entity 0s on tx/ty are good' , () => {
  setCurrentEntities([{
    'location': {
      'tx': 'A',
      'ty': 'B',
      'px': 'C',
      'py': 'D'
    }
  }]);

  vals.loc_tx = 0;
  vals.loc_ty = 0;
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].location.tx).toEqual(0);
  expect(getCurrentEntities()[0].location.ty).toEqual(0);
  expect(getCurrentEntities()[0].location.px).toBeUndefined();
  expect(getCurrentEntities()[0].location.py).toBeUndefined();
});

test('update_entity 0s on px/py are good' , () => {
  setCurrentEntities([{
    'location': {
      'tx': 'A',
      'ty': 'B',
      'px': 'C',
      'py': 'D'
    }
  }]);

  vals.loc_px = 1;
  vals.loc_py = 2;
  _update_entity_inner(0, vals);

  expect(getCurrentEntities()[0].location.tx).toBeUndefined();
  expect(getCurrentEntities()[0].location.ty).toBeUndefined();
  expect(getCurrentEntities()[0].location.px).toEqual(1);
  expect(getCurrentEntities()[0].location.py).toEqual(2);
});