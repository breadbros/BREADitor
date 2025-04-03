// / the contents of a fresh BODY for the app
export function baseHTMLTemplate() {
	return `	
        <div class="map-palette ui-widget-content resizable-window draggable-window" data-minwidth="280">
            <h3 class="ui-widget-header">Map<button class="close-palette">x</button></h3>
            <div class="map_canvas_container">
                <canvas class="map_canvas"></canvas>
            </div>
        </div>

        <div class="tileset-selector-palette ui-widget-content resizable-window draggable-window">
            <h3 class="ui-widget-header">Tileset
                <span id="vsp-zoom-label"></span>
                <button class="close-palette">x</button>
            </h3>
            <div class="tileset_selector_canvas_container">
                <h3 class="note" style="text-align: center;">(Select a layer to see its tileset)</h3>
                <canvas class="tileset_selector_canvas"></canvas>
            </div>
        </div>

        <div class="screenview-indicator-palette ui-widget-content resizable-window draggable-window">
            <h3 class="ui-widget-header">Screenview Indicator
                <span id="vsp-zoom-label"></span>
                <button class="close-palette">x</button>
            </h3>
            <div class="screenview_indicator_container">
                Viewport: <input type="checkbox" id="screenview-indicator-switch"> <br />
                X: <input type="text" id="screenview-indicator-x"> <br />
                Y: <input type="text" id="screenview-indicator-y"> <br />
                Width: <input type="text" id="screenview-indicator-width"> <br />
                Height: <input type="text" id="screenview-indicator-height"> <br />
            </div>
        </div>


        <div class="tool-palette ui-widget-content draggable-window">
            <h3 class="ui-widget-header" id="tool-title">Tool<button class="close-palette">x</button></h3>

            <button id="btn-tool-select" title="Select (M)"></button>
            <button id="btn-tool-move-viewport" title="Move Viewport (space)"></button>
            <button id="btn-tool-drag-item" title="Drag Item (V)"></button>
            <button id="btn-tool-eyedropper" title="Eyedropper (I)"></button>
            <button id="btn-tool-draw" title="Draw (B)"></button>
            <button id="btn-tool-flood-fill" title="Fill (G)"></button>
            <button id="btn-tool-zoomin" title="Zoom In"></button>
            <button id="btn-tool-zoomout" title="Zoom Out"></button>
            <button id="btn-tool-debugger" title="Debugger"></button>
            <button id="btn-tool-smart-eyedropper" title="Smart Eyedropper (Shift-I)"></button>

            <button id="btn-add-tree">+ Tree</button>
            <button id="btn-dump-screen">SCRN DMP</button>
            <!-- <button id="btn-tool-select">Slct</button>
             --><!--
            <button id="btn-tool-fill" disabled="">Fill</button>
            <button id="btn-tool-line" disabled="">Line</button>
            <button id="btn-tool-block" disabled="">Block</button>
            <button id="btn-tool-mark" disabled="">Mark</button>
            <button id="btn-tool-cut" disabled="">Cut</button>
            <button id="btn-tool-copy" disabled="">Copy</button>
            <button id="btn-tool-paste" disabled="">Paste</button>
            -->

            <div id="left-palette" class="tooltip-tile-selector"></div>
            <div id="right-palette" class="tooltip-tile-selector" disabled=""></div>
        </div>

        <div class="layers-palette ui-widget-content draggable-window resizable-window" data-minWidth="280">
            <h3 class="ui-widget-header">Layers<button class="close-palette">x</button></h3>

            <div class="window-container">
                <ul class="layers-list">
                </ul>
            </div>

            <button id="layers-new">New</button>
        </div>

        <div class="zones-palette ui-widget-content draggable-window resizable-window" data-minWidth="250">
            <h3 class="ui-widget-header">Zones<button class="close-palette">x</button></h3>

            <div class="window-container">
                <div id="zone-count">zones: <span id="zones-number"></span></div>
                <ul class="zones-list">

                </ul>
            </div>

            <button id="zones-new">New</button>
            <!-- <button id="zones-spreadsheet">Spreadsheet Mode</button> -->
        </div>

        <div class="entity-palette ui-widget-content draggable-window resizable-window" data-minWidth="280">
            <h3 class="ui-widget-header">Entities<button class="close-palette">x</button></h3>

            <div class="window-container">
                <div id="entity-count">entities: <span id="entity-number"></span></div>
                <ul class="entity-list">
                </ul>
            </div>

            <button id="entity-new">New</button>
            <!-- <button id="entity-spreadsheet">Spreadsheet Mode</button> -->
            <br><br>

            &nbsp;&nbsp;Entity Bounds Drawing:<br>
            <input id="all_entity_bounds_color" type=hidden>
            &nbsp;&nbsp;<input id="all_entity_bounds_draw_picker"> <button id="all_entity_bounds_draw_off">Turn Off</button>

            <br><br>

            &nbsp;&nbsp;Entity Hitbox Drawing:<br>
            <input id="all_entity_hitbox_bounds_color" type=hidden>
            &nbsp;&nbsp;<input id="all_entity_hitbox_bounds_draw_picker"> <button id="all_entity_hitbox_bounds_draw_off">Turn Off</button>

            <br><br>

            &nbsp;&nbsp;Entity Tall Redraw Bounds Drawing:<br>
            <input id="all_entity_tallredraw_bounds_color" type=hidden>
            &nbsp;&nbsp;<input id="all_entity_tallredraw_bounds_draw_picker"> <button id="all_entity_tallredraw_bounds_draw_off">Turn Off</button>
        </div>

        <div class="info-palette ui-widget-content draggable-window resizable-window" data-minWidth="200">
            <h3 class="ui-widget-header">Info<button class="close-palette">x</button></h3>
            <ul>
                <li>map: <span id="info-mapname"></span></li>
                <li>vsps: <ul id="info-vsp-list"></ul>
                <li>tx,ty: <span id="info-current-hover-tile"></span></li>
                <li>dims: <span id="info-dims"></span></li>
                <li>screen loc: <span id="info-location"></span></li>
                <li>zoomlevel: <span id="info-zoom"></span></li>
                <li>selected tiles: <span id=info-selected-tiles></span></li>
                <li>rstring: <span id=info-rstring></span></li>
                <li>current tool: <span id=info-curTool></span></li>

            </ul>
        </div>

        <div id="modal-dialog" title="BUTTS, LOL">
          <p>This is the default dialog. Someone didn't put content into it.</p>
        </div>

        <div id="notifications-window"></div>


`;

        
}