/* ==============================  PALETTES  ===================================
 *
 *      Palettes are the main way that users interact with the map.
 * They have self-contained state and are responsible for manipulating
 * the editor. Palettes register input events like mousemove, keypress, etc.
 * with the DOM and call methods such as gamestate.addUnit accordingly. You
 * can think of a Palette as a toolset by which to interact with the editor
 * in logical ways.
 *
 *      The Editor has exactly one "active" Palette at any given time. Only
 * the active Palette's input events should fire at any given time (it is the
 * responsibility of the Palette itself to register/deregister its events).
 * Each Palette has a 'domElement' jquery object that represents the Palette's
 * UI elements. The active Palette's domElement should always be shown, and 
 * inactive Palettes' domElements hidden. To control the activation/inactivation
 * of Palettes, it may listen to a "selectionGained" or "selectionLost" event
 * that gets fired when the Editor's active Palette changes.
 *
 *      Finally, each Palette has a renderMethod that gets called regularly by which
 * the Palette can draw custom graphics onto the editor (they also have handleClick
 * and handleDragEnd).
 *
 * Summary:
 *
 *      Palettes are the main way to interact with the map
 *      Palettes need to register/deregister their own input listeners
 *      There's only one active Palette
 *      Palettes have custom rendering
 *
 * =============================================================================
 */


function Palette(editor) {
    this.editor = editor;
}

/*
 * Convenience method to bind a given event handler function when this palette has selection, and unbind it when it loses selection.
 *
 * PARAMETERS
 *     elements - any selector accepted by jQuery()
 *     eventName - the event to listen for (keypress, mousemove, etc)
 *     handler - the event handler callback function
 */

Palette.prototype.bindInputOnSelection = function(elements, eventName, handler) {
    $(this).bind("selectionGained", function() {
        console.log(this.constructor.name+" just gained "+eventName+"!");
        $(elements).on(eventName, handler);
    });
    $(this).bind("selectionLost", function() {
        console.log(this.constructor.name+" just lost "+eventName+"!");
        $(elements).off(eventName, handler);
    });
}
