/* eslint no-undef: 1 */
import { FakeMap } from './FakeMap';

test('get and set tile on fake map', () => {
  const map = FakeMap();
  expect(map.getTile(0, 0, 0)).toEqual(0);
  map.setTile(0, 0, 0, 42);
  expect(map.getTile(0, 0, 0)).toEqual(42);
});

test('fake maps do not share tilespace', () => {
  const map = FakeMap();
  expect(map.getTile(0, 0, 0)).toEqual(0);
  map.setTile(0, 0, 0, 42);
  expect(map.getTile(0, 0, 0)).toEqual(42);

  const map2 = FakeMap();
  expect(map.getTile(0, 0, 0)).toEqual(42);
  expect(map2.getTile(0, 0, 0)).toEqual(0);
});

test('prove fakemap copies layerData on output so that get/setTile are the only ways to mutate fake layer data', () => {
  const map = FakeMap();
  const layer = 1;

  expect(map.getTile(0, 0, layer)).toEqual(1);

  const layer1Copy = map.getLayerData(1);

  expect(layer1Copy[0][0]).toEqual(1);
  layer1Copy[0][0] = 17;
  expect(map.getTile(0, 0, layer)).toEqual(1);
});
