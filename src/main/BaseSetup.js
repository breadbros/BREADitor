import { LOG, INFO } from '../Logging';
import { TilesetSelectorWidget } from '../js/ui/TilesetSelectorPalette.js';
import { Map, verifyTileData, verifyMap, cleanEntities } from '../Map.js';
import { Palettes } from '../Palettes.js';
import {
    LayersWidget,
    selectNumberedLayer,
    visibilityFix,
    getSelectedLayer,
    MAGICAL_ENT_LAYER_ID,
    MAGICAL_OBS_LAYER_ID,
    MAGICAL_ZONE_LAYER_ID
} from '../js/ui/LayersPalette.js'; // , selectZoneLayer, selectObstructionLayer, selectNumberedLayer, newLayerOnNewMap
import { ZonesWidget } from '../js/ui/ZonesPalette.js';
import { EntitiesWidget } from '../js/ui/EntityPalette.js';
import { updateMapAndVSPFileInfo } from '../js/ui/InfoPalette.js';
import {
    getCurrentHoverTile,
    initTools,
    updateRstringInfo,
    updateLocationFunction,
    selectAll,
    updateInfoDims
} from '../Tools.js';
import { cut, copy, paste } from '../js/ui/CutCopyPaste';
import { handleUndo, handleRedo } from '../UndoRedo';
import { setupNotifications, notify } from '../Notification-Pane';
import { setSuperCutPasteLayers, superCut, superPaste } from '../js/ui/SuperCutPaste';
import { APPDATA_DIR, BREADPATH } from './FileSystemSetup';
import { PNG } from 'pngjs';
import { loadPlugins } from '../Plugins';

const jetpack = require('fs-jetpack');

const $ = window.$;
const path = require('path');
const { dialog } = require('electron').remote;
const fs = require('fs');

const updateScreenview = map => {
    $('#screenview-indicator-switch').prop('checked', map.windowOverlay.on);
    $('#screenview-indicator-x').val(map.windowOverlay.viewport.x);
    $('#screenview-indicator-y').val(map.windowOverlay.viewport.y);
    $('#screenview-indicator-width').val(map.windowOverlay.viewport.width);
    $('#screenview-indicator-height').val(map.windowOverlay.viewport.height);
};

// / TODO: why have both $$$_BREDITOR_MOST_RECENT.json and $$$_MAPED.json... 🤔
// / I guess one should be in the appdir to at least point to the project directory...
const loadMostRecentFileOption = () => {
    // / TODO: is there a reason for requiring these in-block like this, or is it just cargo cult copypasta?
    const jp = jetpack.cwd(APPDATA_DIR);

    const appConfigData = jp.read(BREADPATH.getMostRecentFilesJSONPath(), 'json');
    window.$$$_most_recent_options = appConfigData;

    return appConfigData;
};

const initScreen = map => {
    updateScreenview(map);

    $('#screenview-indicator-switch').click(() => {
        map.windowOverlay.on = $('#screenview-indicator-switch').prop('checked');
    });

    $('#screenview-indicator-x').on(
        'change',
        ev => (map.windowOverlay.viewport.x = parseInt($(ev.target).val(), 10))
    );
    $('#screenview-indicator-y').on(
        'change',
        ev => (map.windowOverlay.viewport.y = parseInt($(ev.target).val(), 10))
    );
    $('#screenview-indicator-width').on(
        'change',
        ev => (map.windowOverlay.viewport.width = parseInt($(ev.target).val(), 10))
    );
    $('#screenview-indicator-height').on(
        'change',
        ev => (map.windowOverlay.viewport.height = parseInt($(ev.target).val(), 10))
    );
};

const initInfoWidget = map => {
    updateMapAndVSPFileInfo(map);
};

function killAllElementListeners($elem) {
    // first argument of function: "$._data ()" is: "Element" - not jQuery object
    $.each($._data($elem, 'events'), function(name) {
        LOG(`body had listener: ${name}`);
        $elem.off(name); // function off() removes an event handler
    });
}

function killAllDocumentListeners(doc) {
    // first argument of function: "$._data ()" is: "Element" - not jQuery object
    $.each($._data($elem, 'events'), function(name) {
        LOG(`body had listener: ${name}`);
        $elem.off(name); // function off() removes an event handler
    });
}

function setupShiftKeyPressed() {
    // TODO this are evil.
    window.isShiftKeyPressed = false;
    $(document).on('keyup keydown', function(e) {
        window.isShiftKeyPressed = e.shiftKey;
    });
}

let __setupChording_once = false;

// TODO: verify all this cannot be done with accelerators
function setupChording() {
    if (__setupChording_once) {
        return;
    }

    // this is dumb.
    __setupChording_once = true;

    $('body').on('keydown', e => {
        if (!(e.ctrlKey || e.cmdKey)) {
            // TODO verify this on mac, cmdKey is a guess.
            return;
        }

        if (document.activeElement.type && document.activeElement.type === 'text') {
            INFO('in a textfield, ignoring the accelerator');
            return;
        }

        // if(e.key === 'c' && ) {
        //   INFO('on the tools palette, ignoring the spacebar');
        //   return;
        // }

        // TODO all of these commands should probably be passed in the map on the currently active map palette
        // (if there is one) so as to include the tileset map or any future ones
        if (e.key === 'c' || e.key === 'C') {
            LOG('edit-copy, but the one on the document.  SIGH WINDOWS.');

            if (
                window.$$$currentMap.selection.tiles &&
                window.$$$currentMap.selection.tiles.length
            ) {
                copy(window.$$$currentMap);
            } else if (
                window.$$$currentTilsesetSelectorMap &&
                window.$$$currentTilsesetSelectorMap.selection.tiles &&
                window.$$$currentTilsesetSelectorMap.selection.tiles.length
            ) {
                copy(window.$$$currentTilsesetSelectorMap);
            } else {
                LOG('FALL THROUGH');
            }

            return;
        }

        if (e.key === 'v' || e.key === 'V') {
            if (e.shiftKey) {
                LOG('super-paste, but the one on the document.  SIGH WINDOWS.');
                window.$$$superpaste();
                return;
            }
            LOG('edit-paste, but the one on the document.  SIGH WINDOWS.');
            paste(window.$$$currentMap);
            return;
        }

        if (e.key === 'x' || e.key === 'X') {
            if (e.shiftKey) {
                LOG('super-cut, but the one on the document.  SIGH WINDOWS.');
                window.$$$supercut();
                return;
            }
            LOG('edit-cut, but the one on the document.  SIGH WINDOWS.');
            cut(window.$$$currentMap);
            return;
        }

        if (e.key === 'a' || e.key === 'A') {
            LOG('edit-select-all but the one on the document.  SIGH WINDOWS.');
            selectAll(window.$$$currentMap);
        }
    });
}

// TODO: jesus pull this apart and clean it up.

const tick = function(timestamp) {
    if (window.$$$currentMap && window.$$$currentMap.render) {
        window.$$$currentMap.render();
        TilesetSelectorWidget.renderTilesetSelectorWidget();
    }

    if (window.$$$SCREENSHOT) {
        window.$$$SCREENSHOT();
        window.$$$SCREENSHOT = null;
    }

    window.requestAnimationFrame(tick);
};

/**
 * Setup the rest of the app ;D
 */
function setupTheRestOfTheApp() {
    Palettes.setupPaletteRegistry();

    if (window.$$$currentMap) {
        window.$$$currentMap.selfDestruct();
    }
    window.$$$currentMap = null;

    if (!window.$$$RAF_INIT) {
        window.$$$RAF_INIT = true;
        window.requestAnimationFrame(tick);
    }

    $('#btn-tool-undo').click(() => {
        handleUndo();
    });
    $('#btn-tool-redo').click(() => {
        handleRedo();
    });
}

export function autoloadMostRecentMapIfAvailable() {
    const fs = require('fs');

    const opts = loadMostRecentFileOption();

    if (opts && opts.abs_path_to_maps && opts.most_recent_map) {
        const filepath = path.join(opts.abs_path_to_maps, opts.most_recent_map);

        if (fs.existsSync(filepath)) {
            INFO(`${filepath} specified to autoload...`);
            loadByFilename(filepath);
        } else {
            INFO(`${filepath} specified to autoload... but it wasn't there.`);
        }
    } else {
        INFO('No map specified to autoload.');
    }
}

/**
 * Necesary to setup a freshly loaded map.
 */
export function setupFreshApp() {
    killAllElementListeners($('#body'));
    // killAllDocumentListeners(document);

    setupShiftKeyPressed();

    setupChording();

    setupTheRestOfTheApp();

    setupNotifications();

    loadPlugins();
}

export function setupWindowFunctions() {
    const newMapDialog = () => {
        const $template = `
      <p>Last step: how big (in tiles) do you want the base layer of your new map to be?</p>
      Width  <input id="newmap-width" type="number"><br/>
      Height  <input id="newmap-height" type="number"><br/>
      <hr>
      <p class="note">Nothing has yet been altered on your disk.  However: pressing "CREATE ALL NEW FILES" will create and/or overwrite any files you've specified during this process.</p>
    `;

        const title = 'Step 4: Create new map';

        $('#modal-dialog').html('');
        $('#modal-dialog').append($template);
        $('#modal-dialog').show();

        window.$$$hide_all_windows();

        const dialog = $('#modal-dialog').dialog({
            width: 500,
            modal: true,
            title,
            buttons: {
                Cancel: function() {
                    $('#modal-dialog').dialog('close');
                },
                'CREATE ALL NEW FILES': () => {
                    const wid = parseInt($('#newmap-width').val(), 10);
                    const hig = parseInt($('#newmap-height').val(), 10);

                    if (wid > 0 && hig > 0) {
                        SaveNewMap();
                    } else {
                        alert('Invalid values.  Please try again.');
                    }
                }
            }
        });
    };

    const dialoger = (title, template, buttonMap, noCancel, afterDialogOpenFn) => {
        $('#modal-dialog').html('');
        $('#modal-dialog').append(template);
        $('#modal-dialog').show();

        window.$$$hide_all_windows();

        if (!noCancel && !buttonMap.cancel && !buttonMap.Cancel) {
            buttonMap.Cancel = {
                text: 'Close',
                click: () => {
                    $('#modal-dialog').dialog('close');
                },
                id: 'modal-dialog-close-button',
                class: 'close-button'
            };
        }

        const dialog = $('#modal-dialog').dialog({
            width: 500,
            modal: true,
            title: title,
            buttons: buttonMap
        });

        if (afterDialogOpenFn) {
            afterDialogOpenFn();
        }
    };

    const newVspDialogPreStepCopyOrRef = existingVspFilename => {
        const relPath = path.relative(
            path.dirname(window.newMapFilename),
            path.dirname(existingVspFilename)
        ); // + path.basename(existingVspFilename);
        let shittyMutex4 = false;

        dialoger(
            'Step 2c: Copy it or reference it?',
            `
      <p>You selected:</p>
      <div class=code>${window.newMapFilename}</div>
      <hr>
      <div class=code>${existingVspFilename}</div>
      <hr>
      <div class=code>${relPath}</div>
      <p class=note>Note: this will be saved internally relative to the location of your Tileset's definition file.</p>
      <p>Would you like your new tileset to COPY that image<br>or would you like your new tileset to REFERENCE that image?</p>
      <p>Copying means changes you make to it will not be refelected in other tilesets that used the original.</p>
      <p>Referencing means if you move your image around, it'll likely break things and you'll need to edit the json file to fix it.</p>
      `,
            {
                'Make a new COPY': () => {
                    if (shittyMutex4) return;
                    shittyMutex4 = true;
                    dialog.showSaveDialog(
                        { filters: [{ name: 'image', extensions: ['png'] }] },
                        filename => {
                            shittyMutex4 = false;
                            if (existingVspFilename == filename) {
                                alert(
                                    'You selected to copy over the original image.  Please try again and enter a new filename.'
                                );
                                return;
                            }

                            if (filename) {
                                newVspDialogStepFinal(existingVspFilename, filename);
                            }
                        }
                    );
                },
                'Keep the same REFERENCE': () => {
                    newVspDialogStepFinal(existingVspFilename);
                }
            }
        );
    };

    const errorHandler = (val, sel) => {
        const ret = Number.isNaN(val) || val <= 0;
        ret ? $(sel).addClass('error') : $(sel).removeClass('error');
        return !ret;
    };

    const newVspDialogStepFinal = (existingImageFilename, newImageCopyFilename) => {
        let w = 256;
        let h = 256;

        if (existingImageFilename) {
            const data = fs.readFileSync(existingImageFilename);
            const png = PNG.sync.read(data);

            if (png) {
                w = png.width;
                h = png.height;
            }
        }

        const listener = () => {
            const vw = parseInt($('#vsp-width').val(), 10);
            const vh = parseInt($('#vsp-height').val(), 10);
            const tw = parseInt($('#tile-width').val(), 10);
            const th = parseInt($('#tile-height').val(), 10);

            let valid = true;
            valid &= errorHandler(vw, '#vsp-width');
            valid &= errorHandler(vh, '#vsp-height');
            valid &= errorHandler(tw, '#tile-width');
            valid &= errorHandler(th, '#tile-height');
            valid &= errorHandler($('#image-name').val().length, '#image-name');
            valid &= errorHandler($('#vsp-name').val().length, '#vsp-name');

            if (!valid) {
                $('#tiles-per-row')
                    .val('-')
                    .removeClass('error');
                $('#tiles-total')
                    .val('-')
                    .removeClass('error');
            } else {
                const perRow = parseInt(vw / tw, 10);
                const perCol = parseInt(vh / th, 10);

                $('#tiles-per-row').val(perRow);
                $('#tiles-total').val(perRow * perCol);

                if (perRow <= 0) {
                    $('#tiles-total').addClass('error');
                } else {
                    $('#tiles-total').removeClass('error');
                }

                if (perRow * perCol <= 0) {
                    $('#tiles-total').addClass('error');
                } else {
                    $('#tiles-total').removeClass('error');
                }
            }
        };

        const verify = () => {
            return $('#modal-dialog input.error').length === 0 && $('#vsp-name').val();
        };

        let topPart;
        if (existingImageFilename && newImageCopyFilename) {
            const imagename = path.basename(existingImageFilename);
            topPart = `
        <p>We will create a new tileset definition by copying an existing file:</p>
        <div class=code>${existingImageFilename}</div>
        <p>To a new copy of that file at:</p>
        <div class=code>${newImageCopyFilename}</div>

        <p>
        image name: <input id="image-name" value="${imagename}" READONLY><br>
        image width: <input id="vsp-width" value="${w}" READONLY><br>
        image height: <input id="vsp-height" value="${h}" READONLY>
        <p>
      `;
        } else if (existingImageFilename === null && newImageCopyFilename === true) {
            topPart = `
      <p>We will create a new tileset definition by creating a brand new image!</p>

      <p class="note">Note: it's usually optimal to have your width and height be the same number (square) and a power of 2.</p>

      <p>
        imagename: <input id="image-name" value="" READONLY> <button id="choose-image">Choose...</button> <br>
        image width: <input id="vsp-width" value="${w}"><br>
        image height: <input id="vsp-height" value="${h}">
      <p>
      `;
        } else {
            const vspname = path.basename(existingImageFilename);
            topPart = `
        <p>We will create a new tileset definition by referencing an existing file:</p>
        <div class=code>${existingImageFilename}</div>
        <p>...and storing that as a relative path to the Tileset Definition you are about to save.</p>

        <p>
        imagename: <input id="image-name" value="${vspname}" READONLY><br>
        image width: <input id="vsp-width" value="${w}" READONLY><br>
        image height: <input id="vsp-height" value="${h}" READONLY>
        <p>
        `;
        }

        dialoger(
            'Step 2d: Define your Tileset',
            `
        ${topPart}
        <p>
          tile width: <input id="tile-width" value=""><br>
          tile height: <input id="tile-height" value=""><br>
          (tiles per row): <input id="tiles-per-row" value="" READONLY><br>
          (tiles total): <input id="tiles-total" value="" READONLY> <br>
          Tileset Definition File: <input id="vsp-name" value="" READONLY> <button id="choose-vsp">Choose...</button> <br>
        <p>
      `,
            {
                Confirm: () => {
                    listener();
                    if (!verify()) {
                        alert('Please fix any errors before continuing.');
                        return;
                    }

                    const vw = parseInt($('#vsp-width').val(), 10);
                    const tw = parseInt($('#tile-width').val(), 10);
                    const th = parseInt($('#tile-height').val(), 10);
                    const tpr = parseInt(vw / tw, 10);
                    const imgName = $('#image-name').val();
                    const vspName = $('#vsp-name').val();

                    window.newMapData.default_vspfile = vspName;
                    window.newVspData = {
                        tilesize: {
                            width: tw,
                            height: th
                        },
                        tiles_per_row: tpr,
                        source_image: {
                            existingImageFilename,
                            newImageCopyFilename,
                            imgName,
                            vspName
                        }
                    };

                    obsModeDialog();
                }
            },
            false,
            () => {
                $('#modal-dialog input').on('keyup', listener);

                let shittyMutex1 = false;
                let shittyMutex2 = false;

                $('#choose-vsp').click(() => {
                    if (shittyMutex1) return;
                    shittyMutex1 = true;
                    dialog.showSaveDialog(
                        {
                            title: 'Save new tileset definion',
                            filters: [{ name: 'text', extensions: ['vsp.json'] }]
                        },
                        filename => {
                            shittyMutex1 = false;
                            if (filename) {
                                $('#vsp-name').val(filename);
                            }
                        }
                    );
                });

                $('#choose-image').click(() => {
                    if (shittyMutex2) return;
                    shittyMutex2 = true;
                    dialog.showSaveDialog(
                        {
                            title: 'Save new tileset image',
                            filters: [{ name: 'img', extensions: ['png'] }]
                        },
                        filename => {
                            shittyMutex2 = false;
                            if (filename) {
                                $('#image-name').val(filename);
                            }
                        }
                    );
                });
            }
        );
    };

    const newVspDialog = () => {
        let shittyMutex3 = false;

        dialoger(
            'Step 2b: Tileset Image Asset',
            `
        <p>Do you want to create a new tileset from an existing image, or a brand new image?<br>(Note: currently only png is supported.)</p>
      `,
            {
                'Existing Image': () => {
                    if (shittyMutex3) return;
                    shittyMutex3 = true;
                    dialog.showOpenDialog(
                        {
                            title: 'Choose Tileset Image',
                            filters: [{ name: 'image', extensions: ['png'] }]
                        },
                        res => {
                            shittyMutex3 = false;
                            if (res) {
                                newVspDialogPreStepCopyOrRef(res[0]);
                            }
                        }
                    );
                },
                'Generate a New Image': () => {
                    newVspDialogStepFinal(null, true);
                }
            }
        );
    };

    const vspModeDialog = () => {
        window.$$$hide_all_windows();
        dialoger('Step 2: Default Tileset Options', ``, {
            'Create new tileset': () => {
                newVspDialog();
            },
            'Choose existing tileset': () => {
                _chooseExistingDefaultTileVSP(obsModeDialog);
            },
            'This map will not have tiles': () => {
                alert('Thats insane! (currently unsupported)');
            }
        });
    };

    function _chooseExistingDefaultTileVSP(obsModeDialog) {
        dialog.showOpenDialog(
            {
                title: 'Choose default VSP',
                filters: [{ name: 'text', extensions: ['vsp.json'] }]
            },
            res => {
                if (!res) {
                    return;
                }
                window.newMapData.default_vspfile = res[0];

                window.newVspData = require('fs-jetpack')
                    .cwd(__dirname)
                    .read(res[0], 'json');

                obsModeDialog();
            }
        );
    }

    const newObsTilesetDialog = () => {
        const validate = () => {
            let valid = true;

            const rows = parseInt($('#tiles-per-row').val(), 10);
            const cols = parseInt($('#tiles-per-col').val(), 10);

            valid &= errorHandler(rows, '#tiles-per-row');
            valid &= errorHandler(cols, '#tiles-per-col');
            valid &= errorHandler($('#obs-image-name').val().length, '#obs-image-name');
            valid &= errorHandler($('#obs-def-name').val().length, '#obs-def-name');

            if (rows && cols && rows > 0 && cols > 0) {
                $('#tiles-total').text(rows * cols);
                $('#image-dims').text(
                    `${window.newVspData.tilesize.width * cols} x ${window.newVspData.tilesize
                        .height * rows} (pixels)`
                );
            }

            return valid;
        };

        dialoger(
            `Step 3a: Create New Obstruction Tileset`,
            `
      <p>
      <p>Obstruction tiles must be the same size as your default tilesize.</p>
      tile width: <input id="tile-width" value="${window.newVspData.tilesize.width}" READONLY><br>
      tile height: <input id="tile-height" value="${window.newVspData.tilesize.height}" READONLY><br>
      
      Rows: <input id="tiles-per-row" value=""><br>
      Columns: <input id="tiles-per-col" value=""><br>

      Image calculated dimensions: <span id="image-dims"></span><br>
      
      (tiles total): <span id="tiles-total"></span><br>
      Obstruction Tileset Image File: <input id="obs-image-name" value="" READONLY> <button id="choose-image">Choose...</button> <br>
      Obstruction Tileset Definition File: <input id="obs-def-name" value="" READONLY> <button id="choose-vsp">Choose...</button> <br>
      </p>
      `,
            {
                Continue: () => {
                    if (!validate()) {
                        alert('Please correct any errors in the form before trying again.');
                        return;
                    }

                    window.newMapData.obs_vspfile = {
                        'obs-image-name': $('#obs-image-name').val(),
                        'obs-def-name': $('#obs-def-name').val(),
                        rows: parseInt($('#tiles-per-row').val(), 10),
                        cols: parseInt($('#tiles-per-col').val(), 10)
                    };
                    newMapDialog();
                }
            },
            false,
            () => {
                $('#modal-dialog input').on('keyup', validate);

                let shittyMutex1 = false;
                let shittyMutex2 = false;

                $('#choose-image').click(() => {
                    if (shittyMutex1) return;
                    shittyMutex1 = true;
                    dialog.showSaveDialog(
                        {
                            title: 'Save new obstruction image data',
                            filters: [{ name: 'image', extensions: ['png'] }]
                        },
                        filename => {
                            shittyMutex1 = false;
                            if (filename) {
                                $('#obs-image-name').val(filename);
                            }
                        }
                    );
                });

                $('#choose-vsp').click(() => {
                    if (shittyMutex2) return;
                    shittyMutex2 = true;
                    dialog.showSaveDialog(
                        {
                            title: 'Save new obstruction definition file',
                            filters: [{ name: 'text', extensions: ['.vsp.json'] }]
                        },
                        filename => {
                            shittyMutex2 = false;
                            if (filename) {
                                $('#obs-def-name').val(filename);
                            }
                        }
                    );
                });
            }
        );
    };

    const obsModeDialog = () => {
        dialoger(
            'Step 3: Default Obstruction Tileset Options',
            `<p class=note>Breaditor presently only supports tile-based obstructions based on 1-bit pngs.</p>
       <p class=note>We will be working on adding vector-based obstructions in the future.</p>`,
            {
                'Choose Existing Obstruction Tileset': () => {
                    _chooseExistingDefaultObsVSP();
                },
                'Create New Obstruction Tileset': () => {
                    newObsTilesetDialog();
                }
            }
        );
    };

    window._newStep2_chooseObsVSP = function(res) {
        newMapDialog();
    };

    const _chooseExistingDefaultObsVSP = function(res) {
        dialog.showOpenDialog(
            {
                title: 'Choose Obstruction VSP',
                filters: [{ name: 'text', extensions: ['obsvsp.json'] }]
            },
            res => {
                if (res) {
                    window.newMapData.obs_vspfile = res[0];
                    newMapDialog();
                }
            }
        );
    };

    window._newStep0_chooseSaveLocation = () => {
        dialog.showSaveDialog(
            { filters: [{ name: 'text', extensions: ['map.json'] }] },
            filename => {
                if (filename) {
                    const jp = jetpack.cwd(APPDATA_DIR);

                    const warning = !jp.exists(filename)
                        ? ''
                        : `<p class=warning>Warning, there is already a map of that name there, and we will overwrite it if you finish this New Map wizard.</p>`;

                    dialoger(
                        'Step 1: Verify Save Location',

                        `<p>You want to create a new map file at</p>
            <p class=monospace>
            ${filename}
            </p>
            <p>
            Is that correct?
            </p>
            ${warning}
            `,
                        {
                            Yes: () => {
                                window.newMapFilename = filename;
                                vspModeDialog();
                            }
                        }
                    );
                }
            }
        );
    };

    window.$$$new = () => {
        window.newMapFilename = '';
        window.newMapData = {};

        window._newStep0_chooseSaveLocation();
    };

    window.$$$save = function(newName, isSaveAs, reloadAfterSave) {
        if (window.$$$currentMap.compactifyZones) {
            window.$$$currentMap.compactifyZones();
        }
        window._save(newName, window.$$$currentMap, isSaveAs || reloadAfterSave);
    };

    window._save = function(newName, map, reloadAfterSave) {
        const jp = jetpack.cwd(APPDATA_DIR);

        let mapfile = null;
        let datafile = null;
        if (typeof newName !== 'undefined') {
            mapfile = newName;
            datafile = mapfile.replace('.map.json', '.map.data.json'); // todo this is shit.
        } else {
            mapfile = map.filenames.mapfile;
            datafile = map.filenames.mapdatafile;
        }

        const mapData = JSON.parse(JSON.stringify(map.mapData));
        const tileData = JSON.parse(JSON.stringify(map.mapRawTileData));

        cleanEntities(mapData); // TODO this should probably happen not-here?

        INFO('saving', mapfile);
        INFO('saving', datafile);

        jp.write(mapfile, mapData);
        jp.write(datafile, tileData);

        saveMostRecentMapLocation(mapfile);

        notify('Saved map.');

        if (reloadAfterSave) {
            INFO('Reloading map after saveas...');
            window.$$$show_all_windows();
            $('#modal-dialog').dialog('close');

            const doAfterNewMapCreate = () => {
                selectNumberedLayer(1);
                visibilityFix();
                window.$$$currentMap.resetCamera();

                window.$$$showPallete('tileset-selector');
                window.$$$showPallete('map');
                window.$$$showPallete('tool');
                window.$$$showPallete('info');
                window.$$$showPallete('layers');

                window.$$$hidePallete('zones');
                window.$$$hidePallete('entity');
                window.$$$hidePallete('screenview-indicator');

                window.$$$collect_all_windows();
            };

            loadByFilename(mapfile, doAfterNewMapCreate);
        }
    };

    window.$$$about_breaditor = () => {
        window.alert(
            'Breaditor is a pile of junk made mostly by @bengrue and a little by Shamus Peveril.' +
                'TODO: make this better.' +
                'TODO: add the licenses jeez.'
        );
    };

    window.$$$collect_all_windows = () => {
        let x = 0;
        let y = 0;
        let z = 0;

        window.$$$palette_registry.map(pal => {
            const node_selector = `.${pal}`;
            const $node = $(node_selector);
            $node.css('top', `${y}px`);
            $node.css('left', `${x}px`);
            $node.css('z-index', z);

            Palettes.correctResizeWidget($node);

            x += 30;
            y += 30;
            z += 2;
        });

        Palettes.savePalettePositions();
    };

    window.$$$show_all_windows = () => {
        window.$$$palette_registry.map(pal => {
            const node_selector = `.${pal}`;
            const $node = $(node_selector);
            $node.show();
        });

        Palettes.savePalettePositions();
    };

    window.$$$hide_all_windows = () => {
        if (!window.$$$palette_registry) return;
        window.$$$palette_registry.map(pal => {
            const node_selector = `.${pal}`;
            const $node = $(node_selector);
            $node.hide();
        });
    };

    window.$$$load = () => {
        const options = {
            filters: [{ name: 'text', extensions: ['map.json'] }]
        };

        if (window.$$$_most_recent_options && window.$$$_most_recent_options.abs_path_to_maps) {
            options.defaultPath = window.$$$_most_recent_options.abs_path_to_maps;
        }

        dialog.showOpenDialog(options, loadByFilename);
    };

    window.$$$superpaste = () => {
        const hoverTile = getCurrentHoverTile();
        if (hoverTile === null) {
            console.error('attempted to paste when hovertile was null.  wtf.');
            return;
        }
        const map = window.$$$currentMap;
        const tX = hoverTile[0];
        const tY = hoverTile[1];

        superPaste(map, tX, tY);
    };

    window.$$$supercut = function() {
        const map = window.$$$currentMap;

        if (getSelectedLayer() === null) {
            alert('Supercut: Please select a layer first.');
            return;
        }

        if (!map.selection.tiles || !map.selection.tiles.length) {
            alert("Supercut: Please mark a selection on a layer first (hotkey 'm').");
            return;
        }

        const title = 'Supercut Setup';

        let $template = `
      <h2>Selection: (${map.selection.hull.x},${map.selection.hull.y}) through (${map.selection.hull
            .w - 1},${map.selection.hull.h - 1})</h2>
      <h3>${map.selection.hull.w - 1 - map.selection.hull.x}x${map.selection.hull.h -
            1 -
            map.selection.hull.y}, ${(map.selection.hull.w - 1 - map.selection.hull.x) *
            (map.selection.hull.h - 1 - map.selection.hull.y)} tiles </h2>
      <h3>Select layers to supercut from:</h3>

      <input type=checkbox checked="true" class="supercut-layers" data-layer-id="${MAGICAL_ZONE_LAYER_ID}">Zones<br> 
      <input type=checkbox checked="true" class="supercut-layers" data-layer-id="${MAGICAL_OBS_LAYER_ID}">Obstructions<br> 
      <input type=checkbox checked="true" class="supercut-layers" data-layer-id="${MAGICAL_ENT_LAYER_ID}">Entities<br> 
      <hr>
    `;

        let layer = null;
        for (let i = 0; i < map.layers.length; i++) {
            layer = map.layers[i];
            $template += `
        <input type=checkbox checked="true" class="supercut-layers" data-layer-id="${i}">${layer.name}<br> 
      `;
        }

        // debugger;
        // window.$$$currentMap;

        $('#modal-dialog').html('');
        $('#modal-dialog').append($template);

        $('#modal-dialog').show();

        const dialog = $('#modal-dialog').dialog({
            width: 500,
            modal: true,
            title,
            buttons: {
                Cut: () => {
                    const layers = [];
                    $('.supercut-layers:checked').each(function() {
                        const me = $(this);
                        layers.push($(me[0]).data('layer-id'));
                    });
                    setSuperCutPasteLayers(layers);
                    superCut(window.$$$currentMap);
                    $('#modal-dialog').dialog('close');
                },
                Cancel: function() {
                    $('#modal-dialog').dialog('close');
                }
            },
            close() {
                $('#modal-dialog').html('');
            }
        });
    };

    window.$$$openRecent = function() {
        const path = require('path');

        const maps = window.$$$_most_recent_options.recent_maps;

        let $template = '';
        for (var i = 0; i < maps.length; i++) {
            $template += `
        <button id="recent-${i}">Open ${maps[i].map}</button><br /> 
      `;
        }

        const title = 'Open recent map';

        $('#modal-dialog').html('');
        $('#modal-dialog').append($template);

        for (var i = 0; i < maps.length; i++) {
            const { basePath } = maps[i];
            const file = maps[i].map;

            $(`#recent-${i}`).on('click', evt => {
                $('#modal-dialog').dialog('close');
                loadByFilename(path.join(basePath, file));
            });
        }

        $('#modal-dialog').show();

        const dialog = $('#modal-dialog').dialog({
            width: 500,
            modal: true,
            title,
            buttons: {
                Cancel: function() {
                    $('#modal-dialog').dialog('close');
                }
            },
            close() {
                $('#modal-dialog').html('');
            }
        });
    };

    window.$$$saveAs = function(isNewMap) {
        dialog.showSaveDialog(
            { filters: [{ name: 'text', extensions: ['map.json'] }] },
            filename => {
                if (filename) {
                    window.$$$save(filename, true, isNewMap);
                }
            }
        );
    };

    window.$$$hidePallete = pal => {
        window.$$$toggle_pallete(pal, false, true);
    };

    window.$$$showPallete = pal => {
        window.$$$toggle_pallete(pal, true);
    };

    /** You are not ready */
    window.$$$toggle_pallete = (pal, forceShow, forceHide) => {
        if (pal.msg) {
            pal = pal.msg;
        }

        let node_selector = '';
        let node = `${pal}-palette`;

        if (window.$$$palette_registry.indexOf(node) >= 0) {
            node_selector = `.${node}`;
            node = $(node_selector);

            if (!node.length) {
                throw new Error(`Invalid palette node selector: '${node_selector}'`);
            }
        } else {
            throw new Error(`Invalid palette name: '${pal}'`);
        }

        if (forceHide) {
            node.hide();

            Palettes.savePalettePositions();
            return;
        }

        if (forceShow) {
            node.show();

            if (node_selector === '.layers-palette') {
                visibilityFix();
            }

            Palettes.savePalettePositions();

            return;
        }

        if (node.is(':visible')) {
            node.hide();
        } else {
            node.show();

            if (node_selector === '.layers-palette') {
                visibilityFix();
            }
        }

        Palettes.savePalettePositions();
    };

    window.appPath = path.dirname(require('electron').remote.app.getAppPath());
}

const SaveNewMap = () => {
    const wid = parseInt($('#newmap-width').val(), 10);
    const hig = parseInt($('#newmap-height').val(), 10);

    debugger;

    doTilesetCreationStuff();
    doObsCreationStuff();
    //doMapCreationStuff(wid, hig);

    //window.$$$saveAs(true);
};

export const weNeedToReferenceATilesetImage = () => {
    return (
        window.newVspData &&
        window.newVspData.source_image &&
        window.newVspData.source_image.existingImageFilename &&
        !window.newVspData.source_image.newImageCopyFilename
    );
    q;
};

export const weNeedToCopyATilesetImage = () => {
    return (
        window.newVspData &&
        window.newVspData.source_image &&
        window.newVspData.source_image.existingImageFilename &&
        window.newVspData.source_image.newImageCopyFilename
    );
};

export const weAreReferencingATileset = testUnsetText => {
    if (!testUnsetText) {
        testUnsetText = '';
    }

    return (
        window.newVspData &&
        typeof window.newVspData.source_image == 'string' &&
        window.newVspData.source_image != testUnsetText
    );
};

export const weAreGoingToMakeAnImageOMG = () => {
    const d = window.newVspData;
    const si = d.source_image;
    return (
        d.tilesize.width > 0 &&
        d.tilesize.height > 0 &&
        d.tiles_per_row > 0 &&
        si.existingImageFilename === null &&
        si.newImageCopyFilename === true &&
        typeof si.imgName == 'string' &&
        typeof si.vspName == 'string'
    );
};

export const doTilesetCreationStuff = () => {
    const i = 4;
    debugger;

    if (weNeedToCopyATilesetImage()) {
        const jp = jetpack.cwd(APPDATA_DIR);
        jp.copy(
            window.newVspData.source_image.existingImageFilename, // from
            window.newVspData.source_image.newImageCopyFilename, // to
            { overwrite: true }
        );
        const fullPathToVSP = window.newVspData.source_image.vspName;
        window.newMapData.default_vspfile = path.join(
            path.relative(
                path.dirname(window.newMapFilename),
                path.dirname(window.newVspData.source_image.vspName)
            ),
            path.basename(window.newVspData.source_image.vspName)
        );

        window.newVspData.source_image = path.join(
            path.relative(
                path.dirname(fullPathToVSP),
                path.dirname(window.newVspData.source_image.newImageCopyFilename)
            ),
            path.basename(window.newVspData.source_image.newImageCopyFilename)
        );

        jetpack.write(fullPathToVSP, window.newVspData);
    } else if (weNeedToReferenceATilesetImage()) {
        const fullPathToVSP = window.newVspData.source_image.vspName;

        window.newMapData.default_vspfile = path.join(
            path.relative(
                path.dirname(window.newMapFilename),
                path.dirname(window.newVspData.source_image.vspName)
            ),
            path.basename(window.newVspData.source_image.vspName)
        );

        window.newVspData.source_image = path.join(
            path.relative(
                path.dirname(fullPathToVSP),
                path.dirname(window.newVspData.source_image.existingImageFilename)
            ),
            path.basename(window.newVspData.source_image.existingImageFilename)
        );

        jetpack.write(fullPathToVSP, window.newVspData);
    } else if (weAreReferencingATileset()) {
        window.newMapData.default_vspfile = path.join(
            path.relative(
                path.dirname(window.newMapFilename),
                path.dirname(window.newMapData.default_vspfile)
            ),
            path.basename(window.newMapData.default_vspfile)
        );
    } else if (weAreGoingToMakeAnImageOMG()) {
    } else {
        throw 'doTilesetCreationStuff for New Map FTUX has apparently fallen through to a state before thought to be impossible!  OH NO!';
    }
};

export const doObsCreationStuff = () => {
    const i = 4;
    debugger;
};

export function doMapCreationStuff(wid, hig) {
    debugger;

    window.$$$currentMap = {
        layers: []
    };

    // "legacy_obstruction_data"
    window.$$$currentMap.layers.length = 1;
    window.$$$currentMap.layers[0] = {
        name: 'New Layer',
        parallax: { X: 1, Y: 1 },
        dimensions: { X: wid, Y: hig },
        alpha: 1,
        vsp: 'default'
    };

    const oneLayerSize = wid * hig;
    window.$$$currentMap.zoneData = Array(oneLayerSize);
    window.$$$currentMap.legacyObsData = Array.apply(null, Array(oneLayerSize)).map(
        Number.prototype.valueOf,
        0
    );
    const blankLayerData = Array.apply(null, Array(oneLayerSize)).map(Number.prototype.valueOf, 0);
    window.$$$currentMap.mapRawTileData = {
        tile_data: [blankLayerData],
        legacy_obstruction_data: window.$$$currentMap.legacyObsData,
        zone_data: []
    };

    window.$$$currentMap.entities = {};
    window.$$$currentMap.entityData = {};
    window.$$$currentMap.entityTextures = {};
    window.$$$currentMap.mapData = {
        notes: [],
        name: '',
        vsp: {
            default: path.basename(window.newMapData.default_vspfile),
            obstructions: path.basename(window.newMapData.obs_vspfile)
        },
        music: '',
        renderstring: '1,E,R',
        initscript: 'start',
        starting_coordinates: [0, 0],
        layers: [
            {
                name: 'New Layer',
                parallax: {
                    X: 1,
                    Y: 1
                },
                dimensions: {
                    X: wid,
                    Y: hig
                },
                alpha: 1,
                vsp: 'default'
            }
        ],
        zones: [
            {
                name: 'NULL_ZONE',
                activation_script: '',
                activation_chance: 0,
                can_by_adjacent_activated: false
            }
        ],
        entities: [],
        tallentitylayer: 'New Layer',
        MAPED_ENTLAYER_VISIBLE: true,
        MAPED_ZONELAYER_VISIBLE: true,
        MAPED_OBSLAYER_VISIBLE: true
    };
}

function loadByFilename(fileNames, andThenFn) {
    if (fileNames === undefined) {
        return;
    }

    const fileName = Array.isArray(fileNames) ? fileNames[0] : fileNames;

    const dataName = fileName.replace('.map.json', '.map.data.json');
    // const vspName = fileName.replace('.map.json', '.vsp.json');

    saveMostRecentMapLocation(fileName);

    // TODO: verify that all three of these files, you know... exist?
    bootstrapMap(fileName, dataName, andThenFn);
}

function saveMostRecentMapLocation(filename) {
    const jp = jetpack.cwd(APPDATA_DIR);
    const appConfigPath = BREADPATH.getMostRecentFilesJSONPath();

    let appConfigData = jp.read(appConfigPath, 'json');
    if (!appConfigData) {
        appConfigData = {};
    }

    appConfigData.abs_path_to_maps = path.dirname(filename);
    appConfigData.most_recent_map = path.basename(filename);

    if (!appConfigData.recent_maps) {
        appConfigData.recent_maps = [];
    }

    appConfigData.recent_maps.unshift({
        basePath: appConfigData.abs_path_to_maps,
        map: appConfigData.most_recent_map
    });

    appConfigData.recent_maps = dedupeRecentMaps(appConfigData.recent_maps);

    window.$$$_most_recent_options = appConfigData;

    jp.write(appConfigPath, appConfigData);
}

const MAX_RECENT_MAPS = 10;

function dedupeRecentMaps(mapQueue) {
    const hitList = {};
    const newQueue = [];

    for (let i = 0; i < mapQueue.length; i++) {
        const key = mapQueue[i].basePath + mapQueue[i].map;
        if (!hitList[key]) {
            newQueue.push(mapQueue[i]);
            hitList[key] = true;
        }

        if (newQueue.length >= MAX_RECENT_MAPS) {
            return newQueue;
        }
    }

    return newQueue;
}

export function bootstrapMap(mapFile, tiledataFile, andThen) {
    const errorHandler = e => {
        console.error(e);
    };

    verifyTileData(tiledataFile).then(() => {
        LOG('verify map?');
        verifyMap(mapFile).then(() => {
            LOG('create map?');

            new Map(mapFile, tiledataFile, map => {
                updateLocationFunction(map);
                updateScreenview(map);
            })
                .ready()
                .then(m => {
                    LOG('Done loading map...');
                    const currentMap = m;
                    m.setCanvas($('.map_canvas'));

                    window.$$$currentMap = currentMap;

                    for (let i = m.mapData.entities.length - 1; i >= 0; i--) {
                        if (!m.mapData.entities[i].animation) {
                            // TODO this is very bad
                            window.alert(
                                `Theres an entity ${i} with unset animation; ALERT GRUE wtf`
                            );
                            // mapData.entities[0].filename
                            m.mapData.entities[i].animation = 'Idle Down'; // TOD no no no
                        }
                    }

                    if (
                        typeof window.$$$currentMap.mapData.MAPED_ENTLAYER_VISIBLE === 'undefined'
                    ) {
                        window.$$$currentMap.mapData.MAPED_ENTLAYER_VISIBLE = true;
                    }

                    if (
                        typeof window.$$$currentMap.mapData.MAPED_ZONELAYER_VISIBLE === 'undefined'
                    ) {
                        window.$$$currentMap.mapData.MAPED_ZONELAYER_VISIBLE = true;
                    }

                    if (
                        typeof window.$$$currentMap.mapData.MAPED_OBSLAYER_VISIBLE === 'undefined'
                    ) {
                        window.$$$currentMap.mapData.MAPED_OBSLAYER_VISIBLE = true;
                    }

                    LayersWidget.initLayersWidget(currentMap);
                    initInfoWidget(currentMap);
                    initScreen(currentMap);
                    ZonesWidget.initZonesWidget(currentMap);
                    EntitiesWidget.initEntitiesWidget(currentMap);

                    initTools($('.map_canvas'), window.$$$currentMap);

                    updateRstringInfo();

                    // mostly for creating new maps.  FOR NOW.
                    if (andThen) {
                        andThen();
                    }

                    // TODO do we need to do this at all?
                    // window.$$$hide_all_windows();
                })
                .catch(e => {
                    LOG(e);
                    throw e;
                });
        });
    });
}
