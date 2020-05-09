BREADitor
=======


How to install:
1. install node.
2. install npm.
3. npm install
4. npm start

Base project: https://github.com/szwacz/electron-boilerplate
End-to-end testing: https://github.com/electron/spectron
App packaging: https://github.com/electron-userland/electron-builder



(just npm start after the first time.)

(Edit this if this is wrong.  Need to install fresh.)

TODO
====
* Fill out the website
* Set up a pipeline for auto-builds

The Immediates for Ustor
========================
* fill, line

* ME4 bugs / improvements

  - tileset
    * If you've selected a parallax layer, the parallax offsets will apply to the tileset (???)

  - general
    * tools can be selected, but either cannot be used, or their effect not visible

The rest
=========

* LINUX/OSX SUPPORT ON FILE ASSETS

* initialize the z-orders of palletes better, and save their order in the save/restore system
* notifications are broken, https://developer.mozilla.org/en-US/docs/Web/API/notification
* Extract all obs-related things into an appropriate library
* Fix Layers palette reflow if you initialize it hidden but then show it.  (needs dynamic resize on show)
* Change mouse cursor to the current tool icon (or crosshairs?)
* force layernames to be unique
  * update entity.location.layer on layername change
  * update map.entities[layername] references on layername change
  * move to UUIDs for this whole thing
* make all .dialog( calls pull from a universal width source
* God, make the edit dialogs look good what's with the lack of label orientation christ what is this the stone ages?
* do not overwrite .chr's in entity.filename with "__default__"
* Christ, figure out a better template formate than just having it inline (just use REACT already?)
  * JSON data definition format for zone/entity etc?  Autogen create/edit?  Stupid?  Smart?
* show scrollbars on main window if there are palettes offscreen.
* setup_shitty_obs_layer like setup_shitty_zone_layer.
* "Gather all" dialogs
* dialogs should live in a module
  * enter should attempt to submit a dialog, no matter what.
* OMG, kill all caught exceptions from the framework. We should be able to "Pause On Caught Exceptions" in peace
* Map palette needs to remember dimensions.
* make sure map.renderString saves/loads properly
* add last eye-open/eye-closed state to savefile (seperate dict from 'game' data. editor-specific state.)
* verify load/save of layer parallax values.
* verify load/save of layer lucency values.
* restore Map palette dimensions like other palettes
* Need a menu item for gathering all windows within the given area, if they are offscreen.
* delete layers
* delete zones
* delete entities
* resize / crop layers
* entity palette
* VSP selector
* entity selector
* a way to show / hide entity indexes on map (and/or click-entity-to-select-it behavior)
* remove the hardcoded 16's in the entity palette: should be referencing the current tileset's tilesize.
* maybe have some data-marker in the format if it's px/py vs tx/ty?
* continuous drawing (draw everything in a line from prevLoc to curLoc per frame.  BREZINGHAMZ J0)
* eyeball icons for entity layer should hide the "normal" entities
* we should change the entity layer paradigm since they can be ANYWHERE now
* eyeball icon for RENDER layer should do ????
* do we even NEED a render layer?
* all layers should have unique string names and that should be enforced.
  * on successful layer namechange, change all entity.location.layers from old -> new
* properly initialize infoWindow upon load
* This list is not exhaustive
* rename __default__ to __VERGE3_DEFAULT__
* on change of entity filename, reload all animation strands
* Require Entity name uniqueness?
  * Modify mapscripts to select entities by name (break the index dependency)
* New Entity:
  * Filename, even when tabbed to
  * Animation <- dependent on valid Filename
  * Facing <- dependent on valid Filename (maybe?)
  * location.layer <- populate


RE-ADD
=======
* to package.json
,
  "pre-commit": [
    "lint",
    "validate",
    "test"
  ]

Credits
=======
Icons designed by Freepik and distributed by Flaticon
