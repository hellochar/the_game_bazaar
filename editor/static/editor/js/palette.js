function Palette(editor) {
    this.editor = editor;
}

//Bind the handler to the event name to the given elements when this palette has selection, and unbind it when it loses selection
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
