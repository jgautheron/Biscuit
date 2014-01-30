YUI.add('editor-plugin', function(Y) {

    /* Private Static variables */
    var
        _cdm = null; // Holds the CodeMirror Instance

    Editor.NAME = 'editor-plugin';
    Editor.NS   = 'editor';

    /**
     * Static property used to define the default attribute
     * configuration for the Editor.
     *
     * @property Editor.ATTRS
     * @type Object
     * @static
     */
    Editor.ATTRS = {
        /**
         * @attribute srcNode
         * @description The outermost DOM node used for hosting the editor
         * @writeOnce
         * @type Node
         */
        srcNode : {
            value : null,
            writeOnce : true
        },
        /**
         * @attribute indentMode
         * @description Determines what the effect of pressing tab is.<br />
         * <ul>
         *    <li>indent Causes tab to adjust the indentation of the selection or current line using the parser's rules.</li>
         *    <li>spaces [Default] Pressing tab simply inserts four spaces</li>
         *    <li>default Leaves the behavior of the tab key to the web browser</li>
         *    <li>shift Pressing tab indents the current line (or selection) one indentUnit deeper, pressing shift-tab, un-indents it</li>
         * </ul>
         *
         * @type String
        */
        indentMode : {
            value : 'spaces',
            writeOnce : false
        },
        /**
         * @attribute indentNewLine
         * @description Determines how indentation is handled when a user inserts a new line.<br />
         * <ul>
         *    <li>indent Causes the new line to be intented by the rules of the parser.</li>
         *    <li>keep [Default] Keeps the indentation of the previous line.</li>
         *    <li>flat Never indents new lines.</li>
         * </ul>
         *
         * @type String
        */
        indentNewLine : {
            value : 'keep',
            writeOnce : false
        },
        /**
         * @attribute indentLength
         * @description An integer that specifies the amount of spaces one 'level' of indentation should add.
         *
         * @type Integer
        */
        indentLength : {
            value : 4,
            writeOnce : false
        }
    };

    function Editor(config) {
        Editor.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Editor, Y.Plugin.Base, {

        /* Api Land */
        setCode : function(code, focus) {
            if (typeof focus === "undefined") {
                focus = true;
            }
            if (code === null) {
                this.empty();
            } else {
                _cdm.setCode(code);
            }
            if (focus) {
                _cdm.focus();
            }
        },

        getCode : function() {
            return _cdm.getCode();
        },

        empty : function() {
            _cdm.setCode('');
        },

        reindent : function() {
            _cdm.reindent();
        },

        setParser : function(parser) {
            _cdm.setParser(parser);
        },

        /* Private land */

        _syncState : function() {

            //Initialize CodeMirror
            _cdm = new CodeMirror(this.srcNode, {
                parserfile : ['parsexml.js', 'parsecss.js', 'tokenizejavascript.js', 'parsejavascript.js', 'parsehtmlmixed.js'],
                stylesheet : ['/css/codemirror/xmlcolors.css', '/css/codemirror/jscolors.css', '/css/codemirror/csscolors.css'],
                path       : '/js/3rdparty/codemirror/',
                tabMode    : this.get('indentMode'),
                indentUnit : this.get('indentLength'),
                enterMode  : this.get('indentNewLine'),
                height     : 'auto',
                //lineNumbers : true,

                // Zen Coding stuff
                syntax: 'html',
                profile: 'xhtml',
                onLoad: Y.bind(function(editor) {
                    zen_editor.bind(editor);
                    editor.grabKeys(keyDown, Y.bind(keyDownFilter, this));
                }, this)
            });
             
            var keyDown = function(event) { 
                // nothing here 
            };

            var keyDownFilter = function(keyCode, event) {
                //console.log(keyCode, event, event.ctrlKey);

                if (event.ctrlKey) {
                    switch (keyCode) {

                        // CTRL + d
                        // duplicates line
                        case 68:
                            event.preventDefault(); 
                            event.stopPropagation(); 
                            event.stop(); 

                            var handle = _cdm.cursorLine(),
                                text = _cdm.lineContent(handle);

                            _cdm.insertIntoLine(handle, 'end', "\n" + text);
                            break;

                        // CTRL + l
                        // removes line
                        case 76:
                            event.preventDefault(); 
                            event.stopPropagation(); 
                            event.stop(); 

                            var handle = _cdm.cursorLine(),
                                nextLine = _cdm.prevLine(handle);
                            _cdm.removeLine(handle);
                            _cdm.jumpToLine(nextLine);
                            break;

                        // CTRL + s
                        // saves the template
                        case 83:
                            event.preventDefault(); 
                            event.stopPropagation(); 
                            event.stop(); 
                            
                            this.app.saveTemplate();
                            break;
                    }
                }

                return false; 
            };
        },

        /* Internals */

        initializer : function(cfg) {

            this.srcNode = Y.one(cfg.srcNode);
            this.app    = this.get('host');

            //this._bindEvents();
            this._syncState();

            Y.log('initialized', null, 'Editor');
        },

        destructor : function() {
            Y.detach('editor|*');
        }

    });

    Y.Editor = Editor;

}, '3.2.0', {requires:['event-custom']});
