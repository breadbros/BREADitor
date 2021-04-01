const jetpack = require('fs-jetpack');
import { doTilesetCreationStuff, doObsCreationStuff, doMapCreationStuff, weNeedToCopyATilesetImage, weNeedToReferenceATilesetImage, weAreReferencingATileset } from './BaseSetup';
const path = require('path');


jest.mock(jetpack);

const New_Tileset_Existing_Image_Copy_Setup = () => {
    window.newMapFilename = "C:/my-project/111.map.json"
    window.newVspData = {
        "tilesize": {
            "width": 1,
            "height": 2
        },
        "tiles_per_row": 320,
        "source_image": {
            "existingImageFilename": "C:/my-project/old-original.png",
            "newImageCopyFilename": "C:/my-project/newtiles-copy.png",
            "vspName": "C:/my-project/newtileset-with-copied-image.vsp.json"
        }
    }
}

const New_Tileset_Existing_Image_CopyReference_Setup = () => {
    window.newMapFilename = "C:/project/a-fake-map.json";
    window.newVspData = {
        "tilesize": {
            "width": 3,
            "height": 4
        },
        "tiles_per_row": 106,
        "source_image": {
            "existingImageFilename": "C:/project/a-tile-image-used-by-many-tilesets.png",
            "vspName": "C:/project/newtileset-with-referenced-image.vsp.json"
        }
    };
}

const Existing_Tileset_Setup = () => {
    window.newMapFilename = "C:/mygame/maps/map.json"
    window.newMapData = {
        default_vspfile: "C:/mygame/tilesets/tileset.json"
    };
    window.newVspData = {
        "tilesize": {
            "width": 16,
            "height": 16
        },
        "tiles_per_row": 20,
        "source_image": "town-tiles.png"
    };
}

const badSetupDeglobalizeMe = () => {
    window.newMapFilename = null;
    window.newMapData  = null;
    window.newVspData  = null;

    window.newMapFilename = "UNSET";

    window.newMapData = {
        "default_vspfile": "UNSET",
        "obs_vspfile": "UNSET",
    };
    
    window.newVspData = {
        "tilesize": {
            "width": -1,
            "height": -1
        },
        "tiles_per_row": -1,
        "source_image": "UNSET"
    }
};

describe('FTUX process', () => {
    beforeEach(() => {
        badSetupDeglobalizeMe();    
    });

    describe('Base Tileset Generation', () => {
        test('Existing Tileset', () => {
            Existing_Tileset_Setup();

            expect(weNeedToCopyATilesetImage()).not.toBeTruthy();
            expect(weNeedToReferenceATilesetImage()).not.toBeTruthy();
            expect(weAreReferencingATileset("UNSET")).toBeTruthy();

            doTilesetCreationStuff();

            expect(window.newMapData.default_vspfile).toBe(`..${path.sep}tilesets${path.sep}tileset.json`);

            expect(jetpack.copy).not.toHaveBeenCalled();
            expect(jetpack.write).not.toHaveBeenCalled();
        });

        test('New Tileset - Existing Image - Copy', () => {
            New_Tileset_Existing_Image_Copy_Setup();

            expect(weNeedToCopyATilesetImage()).toBeTruthy();
            expect(weNeedToReferenceATilesetImage()).not.toBeTruthy();
            expect(weAreReferencingATileset("UNSET")).not.toBeTruthy();
            
            doTilesetCreationStuff();

            const expected = {
                "tilesize": {
                    "width": 1,
                    "height": 2
                },
                "tiles_per_row": 320,
                "source_image": "newtiles-copy.png"
            };

            const expectedCopyCallArgs = [
                "C:/my-project/old-original.png",
                "C:/my-project/newtiles-copy.png",
                {"overwrite": true}
            ];

            expect(window.newVspData).toEqual(expected);  
            expect(window.newMapData.default_vspfile).toBe("newtileset-with-copied-image.vsp.json");
            expect(jetpack.copy.mock.calls[0]).toEqual(expectedCopyCallArgs);
            expect(jetpack.write.mock.calls[0][0]).toEqual("C:/my-project/newtileset-with-copied-image.vsp.json");
            expect(jetpack.write.mock.calls[0][1]).toEqual(expected);
        });

        test.only('New Tileset - Existing Image - Reference', () => {
            New_Tileset_Existing_Image_CopyReference_Setup();
            
            expect(weNeedToCopyATilesetImage()).not.toBeTruthy();
            expect(weNeedToReferenceATilesetImage()).toBeTruthy();
            expect(weAreReferencingATileset("UNSET")).not.toBeTruthy();

            doTilesetCreationStuff();

            const expected = {
                "tilesize": {
                    "width": 3,
                    "height": 4
                },
                "tiles_per_row": 106,
                "source_image": "a-tile-image-used-by-many-tilesets.png"
            };

            expect(window.newVspData).toEqual(expected);  
            expect(window.newMapData.default_vspfile).toBe("newtileset-with-referenced-image.vsp.json");
            expect(jetpack.write.mock.calls[0][0]).toEqual("C:/project/newtileset-with-referenced-image.vsp.json");
            expect(jetpack.write.mock.calls[0][1]).toEqual(expected);
        });

        test('New Tileset - Generate New Image', () => {
        });
    });

    describe('Obstruction Tileset Generation', () => {
    });


    describe('Map Generation', () => {
    });

});





