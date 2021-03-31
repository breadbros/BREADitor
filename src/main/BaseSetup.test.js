const jetpack = require('fs-jetpack');
import { doTilesetCreationStuff, doObsCreationStuff, doMapCreationStuff, weNeedToCopyATilesetImage } from './BaseSetup';

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
            doTilesetCreationStuff();

            expect(1).toBe(2);  
        });

        test.only('New Tileset - Existing Image - Copy', () => {
            New_Tileset_Existing_Image_Copy_Setup();

            expect(weNeedToCopyATilesetImage()).toBeTruthy();

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
        });

        test('New Tileset - Existing Image - Reference', () => {
            doTilesetCreationStuff();

            expect(1).toBe(2);  
        });

        test('New Tileset - Generate New Image', () => {
            doTilesetCreationStuff();

            expect(1).toBe(2);  
        });

        
    });

    describe('Obstruction Tileset Generation', () => {
    });


    describe('Map Generation', () => {
    });

});





