import { v4 as uuidv4 } from 'uuid';
import { modal_error, do_the_no_things, hexToRgba } from './Util.js';
import { LayersWidget, selectEntityLayer } from './LayersPalette.js';
import { notify } from '../../Notification-Pane';

const { clipboard } = require('electron');
const jetpack = require('fs-jetpack');

const { $ } = window;

let _entityLayersExpanded = false;

const getDirFromPath = path => {
    return path.match(/(.*)[\/\\]/)[1] || '';
};

const get_sully_code_line_for_entity = e => {
    let tmp = '';

    if (e.activation_script) {
        tmp += `public void ${e.activation_script}( Entity e ) {`;
    } else {
        tmp += `// no activation script `;
    }

    tmp += `//"${e.name}", uuid: "${e.uuid}"\n`;

    if (e.activation_script) {
        tmp += `\n}\n\n`;
    }

    return tmp;
};

const maybe_change_script_name = e => {
    if (!e.activation_script && e.name) {
        let tmp = e.name.toLowerCase();
        tmp = tmp.replace(/\W/g, '_');
        e.activation_script = tmp;
        return true;
    }

    return false;
};

const generate_functions_from_names = () => {
    let count = 0;

    window.$$$currentMap.mapData.entities.forEach(e => {
        if (maybe_change_script_name(e)) {
            count++;
        }
    });

    notify(`Generated ${count} activation scripts from names.`);
};

const copy_useful_entity_data_to_clipboard = () => {
    let tmp = '';

    window.$$$currentMap.mapData.entities.forEach(e => {
        tmp += get_sully_code_line_for_entity(e);
    });

    clipboard.writeText(tmp, 'clipboard');
    notify('Copied all entity data to clipboard in Sully format.');
};

const copy_useful_single_entity_data_to_clipboard = e => {
    clipboard.writeText(get_sully_code_line_for_entity(e), 'clipboard');
    notify(`Copied entity data for "${e.name}" to clipboard in Sully format.`);
};

const set_animation_dropdown = ($template, animationKeyset, animation) => {
    const $entAnim = $template.find('#entity_animation');

    // repopulate animation select
    $entAnim.empty();
    $.each(animationKeyset, (key, value) => {
        $entAnim.append(
            $('<option></option>')
                .attr('value', value)
                .text(value)
        );
    });

    // set value
    $entAnim.val(animation);
};

export const setNormalEntityVisibility = val => {
    window.$$$currentMap.mapData.MAPED_ENTLAYER_VISIBLE = !!val;
};

export const getNormalEntityVisibility = () => {
    return window.$$$currentMap.mapData.MAPED_ENTLAYER_VISIBLE;
};

export const setEntityLayersExpanded = val => {
    _entityLayersExpanded = !!val;
};

export const getEntityLayersExpanded = () => {
    return _entityLayersExpanded;
};

export const shouldShowEntitiesForLayer = layername => {
    if (!window.$$$currentMap.layerLookup[layername]) {
        modal_error(`cannot shouldShowEntitiesForLayer, '${layername}' is not a layer`);
    }

    const shouldHide = window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS;

    return !shouldHide;
};

export const setShowEntitiesForLayer = (layername, isVisible) => {
    if (!window.$$$currentMap.layerLookup[layername]) {
        modal_error(`cannot setShowEntitiesForLayer, '${layername}' is not a layer`);
    }

    window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS = !isVisible;

    console.log(`ents(${layername})${window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS}`);
};

let currentEntities = null;

// TODO test-only atm.  bad.
export const setCurrentEntities = ce => {
    currentEntities = ce;
    return currentEntities;
};

export const getCurrentEntities = () => {
    return currentEntities;
};

const initEntitiesWidget = map => {
    currentEntities = map.mapData.entities;

    redraw_palette();
    setupColorStuff();

    $('.entity-palette').resize(function() {
        fixContainerSize();
    });

    $('.entity-palette #entity-new').click(evt => {
        new_entity_click(evt);
    });

    $('.entity-palette #entity-spreadsheet').click(() => {
        window.alert('SPREAD THAT SHEET entity SHEIT');
    });

    init();
};

const _select_entity_ui_inner = $node => {
    $('.entity-row').removeClass('highlighted');
    $node.addClass('highlighted');
};

const select_entity_from_pallete = evt => {
    const $it_me = $(evt.target).closest('.entity-row');
    _select_entity_ui_inner($it_me);
    return $it_me;
};

let highlightedEnts = new Set();

export const addEntityToHighlight = ent => {
    ent.MAPED_HIGHLIGHTED = true;
    highlightedEnts.add(ent);
};

export const clearAllEntitysFromHighlight = () => {
    highlightedEnts.forEach(e => {
        delete e.MAPED_HIGHLIGHTED;
    });

    highlightedEnts = new Set();
};

export const getSelectedEntities = () => {
    return Array.from(highlightedEnts);
};

export const moveSelectedEntityToTile = (x, y) => {
    const entList = getSelectedEntities();

    if (entList.length != 1) {
        alert(`Invald number of entities selected.  Need 1, got ${entList.length}`);
        return;
    }

    const ent = entList[0];

    update_entity_location(ent.INDEX, {
        tx: x,
        ty: y,
        px: null,
        py: null
    });

    do_the_no_things(null, redraw_palette);
};

export const moveSelectedEntityToPixel = (px, py) => {
    const entList = getSelectedEntities();

    if (entList.length != 1) {
        alert(`Invald number of entities selected.  Need 1, got ${entList.length}`);
        return;
    }

    const ent = entList[0];

    update_entity_location(ent.INDEX, {
        tx: null,
        ty: null,
        px,
        py
    });

    do_the_no_things(null, redraw_palette);
};

export const selectEntityByIndex = idx => {
    if (!idx) {
        idx = 0;
    }

    const $it_me = $(`.entity-row[data-index=${idx}]`);
    // _select_entity_ui_inner($it_me);
    $it_me.click();
    return $it_me;
};

const singleclick_handler = evt => {
    clearAllEntitysFromHighlight();

    const $ent = select_entity_from_pallete(evt);
    const ent = currentEntities[$ent.data('index')];
    ent.INDEX = $ent.data('index');

    addEntityToHighlight(ent);

    const { hitbox } = window.$$$currentMap.entityData[ent.filename];
    // centerMapOnXY(window.$$$currentMap, ent.location.px - hitbox[0], ent.location.py - hitbox[1], hitbox[2], hitbox[3]);
};

const doubleclick_handler = evt => {
    const $it_me = select_entity_from_pallete(evt);
    edit_entity_click(evt, $it_me.data('index'));
};

const redraw_palette = () => {
    const $list = $('.entity-list');
    $list.html('');

    $('#entity-number').text(currentEntities.length);

    for (let i = 0; i < currentEntities.length; i++) {
        const myBaseData = $$$currentMap.entityData[currentEntities[i].filename];

        const $tmp = $(
            `<li class='entity-row' data-index='${i}'><span class='entity-index'></span><span class='is-maybe-tall'></span><span class='entity-name'></span></li>`
        );

        $tmp.find('.entity-name').text(currentEntities[i].name);

        if (myBaseData && myBaseData.regions && myBaseData.regions.Tall_Redraw) {
            $tmp.find('.entity-index').html(
                `${i} <img src=images/icons/svg/pine.svg style="width: 16px; height: 16px; position: relative; top: 2px;">`
            );
        } else {
            $tmp.find('.entity-index').text(i);
        }

        $tmp.click(singleclick_handler);
        $tmp.dblclick(doubleclick_handler);

        $list.append($tmp);
    }

    fixContainerSize();
};

const fixContainerSize = () => {
    const palette = $('.entity-palette');
    const container = $('.entity-palette .window-container');

    container.height(palette.height() - 290);
};

export const init = () => {
    $(function() {
        $.contextMenu({
            selector: '.entity-palette h3.ui-widget-header',
            callback(key, options) {
                switch (key) {
                    default:
                        console.log(`unknown key: ${key}`);
                        return;
                    case 'generate_functions':
                        generate_functions_from_names();
                        return;
                    case 'copy_scriptnames':
                        copy_useful_entity_data_to_clipboard();
                }
            },
            items: {
                copy_scriptnames: { name: 'Copy useful entity data to clipboard', icon: 'copy' },
                generate_functions: {
                    name: 'Autogenerate activation scripts from name',
                    icon: 'gear'
                }
            }
        });

        $.contextMenu({
            selector: 'li.entity-row',
            callback(key, options) {
                switch (key) {
                    default:
                        console.log(`unknown key: ${key}`);
                        return;
                    case 'code':
                        copy_useful_single_entity_data_to_clipboard(
                            currentEntities[$(this).data('index')]
                        );
                        return;
                    case 'clone':
                        options.$menu.trigger('contextmenu:hide');
                        var entity_to_copy = $(this).data('index');
                        clone_entity(entity_to_copy);
                        return;
                    case 'edit':
                        $(this).dblclick();
                        return;
                    case 'delete':
                        var entity_to_delete = $(this).data('index');
                        if (
                            confirm(`Are you sure you want to delete entity #${entity_to_delete}?`)
                        ) {
                            delete_entity(entity_to_delete);
                        }
                }
            },
            items: {
                edit: { name: 'Edit', icon: 'edit' },
                clone: { name: 'Clone', icon: 'copy' },
                delete: { name: 'Delete', icon: 'delete' },
                code: { name: 'Copy useful entity data to clipboard', icon: 'copy' }
            }
        });
    });
};

const template = `
  <div>Name: <input id='entity_name'></div>
  <div>uuid: <input id='entity_uuid' readonly size=36></div>
  <div>Filename: <input id='entity_filename' size=50></div>
  <div>Animation: <select id='entity_animation'></select>
  <div>Facing: <select id='entity_facing'></select></div>
  <div>Activation Script: <input id='entity_activation_script'></div>
  <div>Pays attention to obstructions?: <input type='checkbox' id='entity_pays_attention_to_obstructions'></div>
  <div>Is an obstructions?: <input type='checkbox' id='entity_is_an_obstruction'></div>
  <div>Autofaces when activated?: <input type='checkbox' id='entity_autofaces'></div>
  <div>Speed: <input id='entity_speed' value='100' size=4></div>
  <div class='tile_coordinates'>Location.tx: <input id='entity_location_tx' size=4></div>
  <div class='tile_coordinates'>Location.ty: <input id='entity_location_ty' size=4></div>
  <div class='pixel_coordinates'>Location.px: <input id='entity_location_px' size=4></div>
  <div class='pixel_coordinates'>Location.py: <input id='entity_location_py' size=4></div>


  <div>Location.layer: <select id='entity_location_layer'></select></div>
  <div>wander: <textarea rows=5 cols=40 id='entity_wander' readonly></textarea></div>
`;

let previousEntityRelPath = '';
let hasDirtyArt = false;
let oldData = null;
let oldEnt = null;
const setup_template = (ent, id) => {
    const $template = $(template);

    if (ent) {
        $('#modal-dialog').attr('title', `Edit Entity (id: ${id})`);
    } else {
        $('#modal-dialog').attr('title', `Add New Entity (id: ${currentEntities.length})`);
    }

    const entityFilenameClickFn = () => {
        const absPathToChrs = jetpack.path(
            window.$$$currentMap.dataPath,
            window.$$$currentMap.mapedConfigData.path_to_chrs
        );
        const curRelPath = $('#entity_filename').val();

        const whatDirToOpenFn = (curPath, absPath, prevRelPath) => {
            if (curPath) {
                // "edit" mode
                const dir = getDirFromPath(curPath);

                if (dir.startsWith(absPath)) {
                    return dir;
                }

                return jetpack.path(absPath, dir);
            } // "new" mode
            if (prevRelPath) {
                return jetpack.path(absPath, prevRelPath);
            }
            return jetpack.path(absPath, curPath);
        };

        // This "could" have been nested trinaries... but NO.
        const whatDirToOpen = whatDirToOpenFn(curRelPath, absPathToChrs, previousEntityRelPath);
        previousEntityRelPath = whatDirToOpen;

        const { dialog } = require('electron').remote;
        dialog.showOpenDialog(
            {
                title: 'Choose a new entity file',
                defaultPath: whatDirToOpen,
                filters: [{ name: 'text', extensions: ['json'] }],
                openFile: true,
                openDirectory: false,
                multiSelections: false
            },
            function(filepath) {
                let path = '';

                if (!filepath) {
                    console.log('No filepath to new entity!');
                    return;
                }

                path = filepath[0];

                // if we're an absolute path, reletivize it!
                if (filepath[0].indexOf(absPathToChrs) === 0) {
                    path = filepath[0].substring(absPathToChrs.length).replace(/\\/g, '/');
                    if (path.indexOf('/') === 0) {
                        path = path.substring(1);
                    }
                }

                if ($('#entity_filename').val() !== path) {
                    hasDirtyArt = true;
                }

                $('#entity_filename').val(path);

                const anims = get_animations_by_filepath(path);
                const animationKeyset = Object.keys(anims);

                if (ent) {
                    set_animation_dropdown($template, animationKeyset, ent.animation);
                } else {
                    set_animation_dropdown(
                        $template,
                        animationKeyset,
                        animationKeyset.length ? animationKeyset[0] : ''
                    );
                }

                const data = get_entity_data(path);
                previousEntityRelPath = getDirFromPath(path);

                if (ent) {
                    oldData = get_entity_data(ent.filename);
                    oldEnt = ent;
                    window.$$$currentMap.maybeAddEntityTexture(data, ent);
                } else {
                    // TODO: is this used?
                    window.$$$currentMap.maybeAddEntityTextureFromFilename(data, path);
                }
            }
        );
    };
    $template.find('#entity_filename').click(entityFilenameClickFn);

    const $entFace = $template.find('#entity_facing');
    const faceKeyset = ['Up', 'Down', 'Left', 'Right'];

    // repopulate facing select
    $entFace.empty();
    $.each(faceKeyset, (key, value) => {
        $entFace.append(
            $('<option></option>')
                .attr('value', value)
                .text(value)
        );
    });

    if (ent) {
        console.log(`Editing: ${ent.name}`);

        $template.find('#entity_name').val(ent.name);
        $template.find('#entity_uuid').val(ent.uuid);
        $template.find('#entity_filename').val(ent.filename);

        $template.find('#entity_activation_script').val(ent.activation_script);
        $template.find('#entity_speed').val(ent.speed);

        $template.find('#entity_location_tx').val(ent.location.tx);
        $template.find('#entity_location_ty').val(ent.location.ty);

        if (typeof ent.location.px === 'undefined') {
            ent.location.px = ent.location.tx * 16; // TODO: should be based on tilesize
            ent.location.py = ent.location.ty * 16; // TODO: should be based on tilesize
        }

        $template.find('#entity_location_px').val(ent.location.px);
        $template.find('#entity_location_py').val(ent.location.py);

        // http://regex.info/blog/2006-09-15/247
        $template.find('#entity_wander').val(
            JSON.stringify(ent.wander)
                .replace(/{/g, '{\n')
                .replace(/}/g, '\n}')
                .replace(/,/g, ',\n')
                .replace(/":/g, '": ')
                .replace(/^"/gm, '\t"')
        );

        $template
            .find('#entity_pays_attention_to_obstructions')
            .prop('checked', ent.pays_attention_to_obstructions);
        $template.find('#entity_is_an_obstruction').prop('checked', ent.is_an_obstruction);
        $template.find('#entity_autofaces').prop('checked', ent.autofaces);

        let entData;
        if (window.$$$currentMap.entityData[ent.filename]) {
            entData = window.$$$currentMap.entityData[ent.filename];
        } else {
            // TODO: load the new entitydata in!
            console.warn(`I DO NOT KNOW HOW TO RENDER [${ent.filename}]`);
            entData = window.$$$currentMap.entityData.__default__;
        }

        // = window.$$$currentMap.entityData[ent.filename] || window.$$$currentMap.entityData['__default__'];
        const animationKeyset = Object.keys(entData.animations);
        set_animation_dropdown($template, animationKeyset, ent.animation);

        // set value.
        $entFace.val(ent.facing);

        const $entLocLay = $template.find('#entity_location_layer');
        const locLayKeyset = LayersWidget.get_layernames_by_rstring_order();
        $entLocLay.empty();
        $.each(locLayKeyset, (key, value) => {
            $entLocLay.append(
                $('<option></option>')
                    .attr('value', value)
                    .text(value)
            );
        });

        $entLocLay.val(ent.location.layer);
    }

    return $template;
};

const SIMPLE_MATH_REGEX = /([-+]?[0-9]*\.?[0-9]+[\/\+\-\*])+([-+]?[0-9]*\.?[0-9]+)/;

function is_simple_math(str) {
    return str.match(SIMPLE_MATH_REGEX) !== null;
}

function do_simple_math(str) {
    if (is_simple_math(str)) {
        return parseInt(eval(str)); // I AM LITERALLY HITLER
    }

    return null;
}

function _maf(selector) {
    if (is_simple_math($(selector).val())) {
        $(selector).val(do_simple_math($(selector).val()));
    }
}

function do_simple_math_if_present() {
    _maf('#entity_location_px');
    _maf('#entity_location_py');
    _maf('#entity_location_tx');
    _maf('#entity_location_ty');
}

function assert_pixel_versus_tile_in_editing() {
    const loc_tx = parseInt($('#entity_location_tx').val());
    const loc_ty = parseInt($('#entity_location_ty').val());

    const loc_px = parseInt($('#entity_location_px').val());
    const loc_py = parseInt($('#entity_location_py').val());

    let pixels_on = false;
    let tiles_on = false;

    const tiles = $('div.tile_coordinates input');
    const pixels = $('div.pixel_coordinates input');

    tiles.css('background-color', '#AAA');
    pixels.css('background-color', '#AAA');

    if (!loc_px && !loc_py) {
        tiles_on = true;
    } else if (loc_tx * 16 === loc_px && loc_ty * 16 === loc_py) {
        // TODO: pi
        tiles_on = true;
    } else {
        pixels_on = true;
    }

    if (tiles_on) {
        tiles.css('background-color', 'white');
    }

    if (pixels_on) {
        pixels.css('background-color', 'white');
    }
}

function new_entity_click(evt) {
    _entity_click(evt);
}

function edit_entity_click(evt, id) {
    _entity_click(evt, id);
}

export const show_edit_entity_dialog = id => {
    const evt = { stopPropagation: () => {} };
    _entity_click(evt, id);
};

let dialog;

function _entity_click(evt, id) {
    evt.stopPropagation();

    const ent = currentEntities[id];

    $(() => {
        const $template = setup_template(ent, id);

        $('#modal-dialog').html('');
        $('#modal-dialog').append($template);

        $('#modal-dialog').show();

        $('#entity_location_tx').on('change', () => {
            $('#entity_location_px').val('');
            $('#entity_location_py').val('');
        });
        $('#entity_location_ty').on('change', () => {
            $('#entity_location_px').val('');
            $('#entity_location_py').val('');
        });
        $('#entity_location_px').on('change', () => {
            $('#entity_location_tx').val('');
            $('#entity_location_ty').val('');
        });
        $('#entity_location_py').on('change', () => {
            $('#entity_location_tx').val('');
            $('#entity_location_ty').val('');
        });

        assert_pixel_versus_tile_in_editing();

        dialog = $('#modal-dialog').dialog({
            width: 500,
            modal: true,
            title: $('#modal-dialog').attr('title'),
            buttons: {
                Save: () => {
                    const _id = $.isNumeric(id) && ent ? id : currentEntities.length;

                    update_entity(_id);

                    hasDirtyArt = false;
                },
                Cancel: function() {
                    if (hasDirtyArt) {
                        // / put it back!
                        window.$$$currentMap.maybeAddEntityTexture(oldData, oldEnt);
                        oldData = null;
                        oldEnt = null;
                        hasDirtyArt = false;
                    }

                    dialog.dialog('close');
                }
            },
            close() {
                $('#modal-dialog').html('');
            }
        });
    });
}

export const update_entity = ent_id => {
    const entity_name = $('#entity_name').val();
    const entity_filename = $('#entity_filename').val(); // TODO: validate existance
    const entity_uuid = $('#entity_uuid').val();
    const entity_activation_script = $('#entity_activation_script').val();
    const entity_speed = parseInt($('#entity_speed').val());

    const entity_pays_attention_to_obstructions = $('#entity_pays_attention_to_obstructions').is(
        ':checked'
    );
    const entity_is_an_obstruction = $('#entity_is_an_obstruction').is(':checked');
    const entity_autofaces = $('#entity_autofaces').is(':checked');

    let entity_wander;

    if (ent_id < currentEntities.length) {
        entity_wander = currentEntities[ent_id].wander;
    } else {
        // add
        entity_wander = { mode: 'Scripted', delay: 0, initial_movestring: '' };
    }

    const entity_animation = $('#entity_animation').val();
    const entity_facing = $('#entity_facing').val();

    do_simple_math_if_present();

    let loc_tx = parseInt($('#entity_location_tx').val());
    let loc_ty = parseInt($('#entity_location_ty').val());

    let loc_px = parseInt($('#entity_location_px').val());
    let loc_py = parseInt($('#entity_location_py').val());

    console.log('loc_tx, loc_ty, loc_px, loc_py:');
    console.log(loc_tx, loc_ty, loc_px, loc_py);

    const loc_l = $('#entity_location_layer').val();

    if (!loc_tx && loc_tx !== 0) {
        loc_tx = null;
    }

    if (!loc_ty && loc_ty !== 0) {
        loc_ty = null;
    }

    if (!loc_px && loc_px !== 0) {
        loc_px = null;
    }

    if (!loc_py && loc_py !== 0) {
        loc_py = null;
    }

    const vals = {
        loc_tx,
        loc_ty,
        loc_px,
        loc_py,
        loc_l,
        entity_animation,
        entity_facing,
        entity_wander,
        entity_name,
        entity_uuid,
        entity_filename,
        entity_activation_script,
        entity_speed,
        entity_pays_attention_to_obstructions,
        entity_is_an_obstruction,
        entity_autofaces
    };

    if (_update_entity_inner(ent_id, vals)) {
        dialog.dialog('close');
        selectEntityByIndex(ent_id);
        scrollEntityPalletteToEntity(ent_id);
    }
};

export const update_entity_location = (ent_id, valDict) => {
    if (!$.isNumeric(ent_id) || ent_id < 0) {
        modal_error(`Invalid input: ent_id (${ent_id}) is invalid.`);
        return false;
    }

    window.$$$currentMap.UndoRedo.change_one_entity_location(ent_id, valDict);

    do_the_no_things(null, redraw_palette);
};

const get_entity_data = chr_filepath => {
    const fullpath = jetpack.path(
        window.$$$currentMap.dataPath,
        window.$$$currentMap.mapedConfigData.path_to_chrs,
        chr_filepath
    );
    console.log(`fullpath to entity for animation verificaiton: ${fullpath}`);

    const data = jetpack.read(fullpath, 'json');

    return data;
};

const get_animations_by_filepath = chr_filepath => {
    const data = get_entity_data(chr_filepath);

    if (!data) {
        console.error(`Invalid entity filepath: ${fullpath}`);
        return [];
    }

    if (!data.animations) {
        console.error(`Entity has no animations: ${fullpath}`);
        return [];
    }

    return data.animations;
};

const is_valid_animation = (chr_filepath, animation_name) => {
    const animations = get_animations_by_filepath(chr_filepath);

    console.info(`data.animations[${animation_name}]: ${animations[animation_name]}`);
    return !!animations[animation_name];
};

const _loc_helper = valDict => {
    const loc = {};

    if (valDict.loc_l) {
        loc.layer = valDict.loc_l;
    }

    loc.tx = valDict.loc_tx;
    loc.ty = valDict.loc_ty;
    loc.px = valDict.loc_px;
    loc.py = valDict.loc_py;

    if (typeof loc.tx !== 'number' && typeof loc.px !== 'number') {
        loc.tx = 0;
        loc.px = 0;
    }

    if (typeof loc.ty !== 'number' && typeof loc.py !== 'number') {
        loc.ty = 0;
        loc.tx = 0;
    }

    return loc;
};

export const _update_entity_inner = (ent_id, valDict) => {
    const loc = _loc_helper(valDict);

    let ent = null;

    if (!$.isNumeric(ent_id) || ent_id < 0) {
        modal_error(`Invalid input: ent_id (${ent_id}) is invalid.`);
        return false;
    }

    if (!$.isNumeric(valDict.entity_speed)) {
        modal_error(`Invalid input: speed not numeric (${valDict.entity_speed}).`);
        return false;
    }

    if (!valDict.entity_facing) {
        valDict.entity_facing = 'Down';
    }

    // if old_value_dict's null, we should undo to deleting ent_id.
    let old_value_dict = null;

    // if old_value_dict's not null, we should restore ent_id's old state.
    if (currentEntities[ent_id]) {
        // these two dicts should be kept in sync for undo/redo.  Any abstraction patterns that could aid this?
        old_value_dict = {
            name: valDict.entity_name,
            uuid: valDict.entity_uuid,
            filename: valDict.entity_filename,
            facing: valDict.entity_facing,
            pays_attention_to_obstructions: valDict.entity_pays_attention_to_obstructions,
            is_an_obstruction: valDict.entity_is_an_obstruction,
            autofaces: valDict.entity_autofaces,
            speed: valDict.entity_speed,
            wander: valDict.entity_wander,
            activation_script: valDict.entity_activation_script,
            animation: valDict.entity_animation,

            location: loc
        };
    }

    ent = {
        name: valDict.entity_name,
        uuid: valDict.entity_uuid,
        filename: valDict.entity_filename,
        facing: valDict.entity_facing,
        pays_attention_to_obstructions: valDict.entity_pays_attention_to_obstructions,
        is_an_obstruction: valDict.entity_is_an_obstruction,
        autofaces: valDict.entity_autofaces,
        speed: valDict.entity_speed,
        wander: valDict.entity_wander,
        activation_script: valDict.entity_activation_script,
        animation: valDict.entity_animation,

        location: loc
    };

    let old_layer;
    let new_layer;

    if (!currentEntities[ent_id]) {
        currentEntities[ent_id] = {};
    }

    if (ent.animation != valDict.entity_animation) {
        // todo lookahead in the new file to see if the new animation name is valid.
        if (!is_valid_animation(ent.filename, ent.animation)) {
            alert(`${ent.filename} does not have animation ${ent.animation}`);
            ent.animation = '';
        }
    }

    let k;
    for (k in ent) {
        if (ent.hasOwnProperty(k)) {
            currentEntities[ent_id][k] = ent[k];
        }
    }

    if (currentEntities[ent_id] && currentEntities[ent_id].location) {
        old_layer = currentEntities[ent_id].location.layer;
    } else {
        old_layer = new_layer;
    }

    if (!ent.uuid) {
        currentEntities[ent_id].uuid = generate_unique_entity_uuid_for_this_map();
    }

    if (old_layer && new_layer && old_layer !== new_layer) {
        relocate_entity_for_map_rendering(currentEntities[ent_id].uuid, old_layer, new_layer);
    }

    do_the_no_things(currentEntities[ent_id], redraw_palette); // these args seem dumb

    if (window.$$$currentMap.mapedConfigData.autoSelectEntityAfterEdit) {
        addEntityToHighlight(currentEntities[ent_id]);

        if (currentEntities[ent_id].location.layer === 'Entity Layer (E)') {
            selectEntityLayer(false);
        }
    }

    return true;
};

export const _does_uuid_already_exist = (uuid, map) => {
    let curEnts = null;
    if (!map) {
        curEnts = currentEntities;
    } else {
        curEnts = map.mapData.entities;
    }

    for (let i = curEnts.length - 1; i >= 0; i--) {
        if (curEnts[i].uuid && curEnts[i].uuid === uuid) {
            return true;
        }
    }

    return false;
};

export const generate_unique_entity_uuid_for_this_map = map => {
    while (true) {
        const uuid = uuidv4();

        if (_does_uuid_already_exist(uuid, map)) {
            continue;
        }

        return uuid;
    }
};

export const delete_entity = ent_id => {
    if (ent_id < 0 || ent_id >= currentEntities.length) {
        console.warn(
            `Attempted to delete out-of bounds entity: ${ent_id} (out of ${currentEntities.length}). `
        );
        return;
    }

    currentEntities.splice(ent_id, 1);
    do_the_no_things(null, redraw_palette); // these args seem dumb
};

const clone_entity = ent_index => {
    const e = currentEntities[ent_index];

    const vals = {
        entity_name: `Copy of ${e.name}`,

        loc_tx: e.location.tx,
        loc_ty: e.location.ty,
        loc_px: e.location.px,
        loc_py: e.location.py,
        loc_l: e.location.layer,
        entity_animation: e.animation,
        entity_facing: e.facing,
        entity_wander: e.wander,
        entity_filename: e.filename,
        entity_activation_script: e.activation_script,
        entity_speed: e.speed,
        entity_pays_attention_to_obstructions: e.pays_attention_to_obstructions,
        entity_is_an_obstruction: e.is_an_obstruction,
        entity_autofaces: e.autofaces
    };

    const new_id = currentEntities.length;

    _update_entity_inner(new_id, vals);

    redraw_palette();

    selectEntityByIndex(new_id);
    scrollEntityPalletteToEntity(new_id);
};

// TODO: ent_name should be a uuid
// TODO: until then, make sure ent_name is verified unique
const relocate_entity_for_map_rendering = (ent_uuid, old_layer, new_layer) => {
    let myboy = null;
    const ents = window.$$$currentMap.entities;

    for (let i = ents[old_layer].length - 1; i >= 0; i--) {
        if (!ents[old_layer][i].uuid) {
            alert(
                'You are trying to move an entity without a UUID.  Reload the map, save it, reload it, and try again.\n\nCancelling action.'
            );
            return;
        }

        if (ents[old_layer][i].uuid === ent_uuid) {
            if (!ents[new_layer]) {
                ents[new_layer] = [];
            }

            myboy = ents[old_layer].splice(i, 1);
            ents[new_layer].push(myboy[0]); // remember to unbox. :(

            return;
        }
    }

    window.alert(
        `FAILED TO MOVE entity '${ent_name}' from layer '${old_layer}' to layer '${new_layer}'.  FOR REASONS.`
    );
};

export const scrollEntityPalletteToEntity = entToFocus => {
    const $container = $('.entity-palette .window-container');
    const $rowToScrollTo = $('.entity-row.highlighted');
    const entIdx = $rowToScrollTo.data('index');
    let msg = '';

    if (!entToFocus) {
        entToFocus = 0;
    }

    if (entIdx !== entToFocus) {
        msg = `unexpected entity index, expected ${entToFocus}, got ${entIdx}`;
        console.log(msg);
        throw msg;
    }

    const loc = parseInt($rowToScrollTo.offset().top - $container.offset().top);

    $('.entity-palette .window-container').scrollTop(loc);
};

const setupEntityBoundsDrawing = () => {
    if (window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_BOUNDS_DRAWING_HEX) {
        $('#all_entity_bounds_color').val(
            window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_BOUNDS_DRAWING_HEX
        );
    }

    let startColor = $('#all_entity_bounds_color').val()
        ? $('#all_entity_bounds_color').val()
        : '#00000000';

    saveAllEntityBoundsColor(startColor);
    if (startColor === '#00000000') {
        $('#all_entity_bounds_draw_off').hide();
    } else {
        startColor = startColor.substr(0, 7);
    }

    const allEntityBoundsColorpicker = $('#all_entity_bounds_draw_picker').spectrum({
        color: startColor,
        showInput: true,
        className: 'full-spectrum',
        showInitial: true,
        showSelectionPalette: true,
        maxSelectionSize: 10,
        preferredFormat: 'hex',
        change(color) {
            const _color = `${color.toHexString()}ff`;
            $('#all_entity_bounds_color').val(_color);
            allEntityBoundsColorpicker.spectrum('set', color.toHexString());
            if (_color !== '#00000000') {
                $('#all_entity_bounds_draw_off').show();
            }
            saveAllEntityBoundsColor(_color);
        }
    });

    $('#all_entity_bounds_draw_off').click(() => {
        $('#all_entity_bounds_draw_off').hide();
        allEntityBoundsColorpicker.spectrum('set', '#00000000');
        saveAllEntityBoundsColor('#00000000');
    });
};

const saveAllEntityBoundsColor = hex => {
    window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_BOUNDS_DRAWING_HEX = hex;
    window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_BOUNDS_DRAWING = hexToRgba(hex);
};

const setupEntityHitboxDrawing = () => {
    if (window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_HITBOX_BOUNDS_DRAWING_HEX) {
        $('#all_entity_hitbox_bounds_color').val(
            window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_HITBOX_BOUNDS_DRAWING_HEX
        );
    }
    let hitboxStartColor = $('#all_entity_hitbox_bounds_color').val()
        ? $('#all_entity_hitbox_bounds_color').val()
        : '#00000000';
    saveAllEntityHitboxBoundsColor(hitboxStartColor);

    if (hitboxStartColor === '#00000000') {
        $('#all_entity_hitbox_bounds_draw_off').hide();
    } else {
        hitboxStartColor = hitboxStartColor.substr(0, 7);
    }

    const allEntityHitboxBoundsColorpicker = $('#all_entity_hitbox_bounds_draw_picker').spectrum({
        color: hitboxStartColor,
        showInput: true,
        className: 'full-spectrum',
        showInitial: true,
        showSelectionPalette: true,
        maxSelectionSize: 10,
        preferredFormat: 'hex',
        change(color) {
            const _color = `${color.toHexString()}ff`;
            $('#all_entity_hitbox_bounds_color').val(_color);
            allEntityHitboxBoundsColorpicker.spectrum('set', color.toHexString());
            if (_color !== '#00000000') {
                $('#all_entity_hitbox_bounds_draw_off').show();
            }
            saveAllEntityHitboxBoundsColor(_color);
        }
    });

    $('#all_entity_hitbox_bounds_draw_off').click(() => {
        $('#all_entity_hitbox_bounds_draw_off').hide();
        allEntityHitboxBoundsColorpicker.spectrum('set', '#00000000');
        saveAllEntityHitboxBoundsColor('#00000000');
    });
};

const saveAllEntityHitboxBoundsColor = hex => {
    window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_HITBOX_BOUNDS_DRAWING_HEX = hex;
    window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_HITBOX_BOUNDS_DRAWING = hexToRgba(hex);
};

const setupEntityTallRedrawDrawing = () => {
    if (window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_TALLREDRAW_BOUNDS_DRAWING_HEX) {
        $('#all_entity_tallredraw_bounds_color').val(
            window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_TALLREDRAW_BOUNDS_DRAWING_HEX
        );
    }
    let tallRedrawStartColor = $('#all_entity_tallredraw_bounds_color').val()
        ? $('#all_entity_tallredraw_bounds_color').val()
        : '#00000000';
    saveAllEntityTallRedrawBoundsColor(tallRedrawStartColor);

    if (tallRedrawStartColor === '#00000000') {
        $('#all_entity_tallredraw_bounds_draw_off').hide();
    } else {
        tallRedrawStartColor = tallRedrawStartColor.substr(0, 7);
    }

    const allEntityTallRedrawBoundsColorpicker = $(
        '#all_entity_tallredraw_bounds_draw_picker'
    ).spectrum({
        color: tallRedrawStartColor,
        showInput: true,
        className: 'full-spectrum',
        showInitial: true,
        showSelectionPalette: true,
        maxSelectionSize: 10,
        preferredFormat: 'hex',
        change(color) {
            const _color = `${color.toHexString()}ff`;
            $('#all_entity_tallredraw_bounds_color').val(_color);
            allEntityTallRedrawBoundsColorpicker.spectrum('set', color.toHexString());
            if (_color !== '#00000000') {
                $('#all_entity_tallredraw_bounds_draw_off').show();
            }
            saveAllEntityTallRedrawBoundsColor(_color);
        }
    });

    $('#all_entity_tallredraw_bounds_draw_off').click(() => {
        $('#all_entity_tallredraw_bounds_draw_off').hide();
        allEntityTallRedrawBoundsColorpicker.spectrum('set', '#00000000');
        saveAllEntityTallRedrawBoundsColor('#00000000');
    });
};

const saveAllEntityTallRedrawBoundsColor = hex => {
    window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_TALLREDRAW_BOUNDS_DRAWING_HEX = hex;
    window.$$$currentMap.mapData.MAPED_GLOBAL_ENTITY_TALLREDRAW_BOUNDS_DRAWING = hexToRgba(hex);
};

const setupColorStuff = () => {
    setupEntityBoundsDrawing();
    setupEntityHitboxDrawing();
    setupEntityTallRedrawDrawing();
};

export const EntitiesWidget = {
    initEntitiesWidget
};
