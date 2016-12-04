import { setObsColor, getObsColor } from "./Map.js";

// beforeEach( () => {
//     setObsColor([-1,-1,-1,-1]);
// } );

test('Get and Set obs color works', () => {

  const expectedVal = [1,2,3,4];

  expect( getObsColor() ).not.toEqual( expectedVal );
  setObsColor( 1,2,3,4 );
  expect( getObsColor() ).toEqual( expectedVal );
});
