Maped 4
=======

How to install:
1. install node.
2. install npm.
3. npm install
4. npm start

(just npm start after the first time.)

(Edit this if this is wrong.  Need to install fresh.)

TODO
====
* force layernames to be unique
  * update entity.location.layer on layername change
  * update map.entities[layername] references on layername change
  * move to UUIDs for this whole thing

* do not overwrite .chr's in entity.filename with "__default__"

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
* entity palette
* VSP selector
* entity selector
* continuous drawing (draw everything in a line from prevLoc to curLoc per frame.  BREZINGHAMZ J0)
* eyeball icons for entity layer should hide the "normal" entities
* we should change the entity layer paradigm since they can be ANYWHERE now
* eyeball icon for RENDER layer should do ????
* do we even NEED a render layer?
* all layers should have unique string names and that should be enforced.
* properly initialize infoWindow upon load
* This list is not exhaustive

Credits
=======
Icons designed by Freepik and distributed by Flaticon