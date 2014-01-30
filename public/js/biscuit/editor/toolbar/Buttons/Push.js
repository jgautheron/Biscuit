YUI.add('toolbar-button-push', function(Y) {
    const REGEX_DATETIME = /^[\d]{2}\-[\d]{2}\-[\d]{4} [\d]{2}\:[\d]{2}\:[\d]{2}$/;
    const BUTTON_LOADING_CLASSNAME = 'loading';

    function ButtonPush() {
        this._initButtonPush();
    }

    ButtonPush.prototype = {
        _initButtonPush : function() {
            this.push.parent = this;
            this.push._init();
        },

        push : {
            overlay : {},

            step : 1,

            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.push');
                this.container = this.app.editor.srcNode;

                this._render();
                this._bindEvents();
            },

            _render : function() {
                this.overlay.prompt = new Y.Overlay({
                    srcNode: '#push-overlay',
                    visible: false,
                    shim: false,
                    plugins : [{fn:Y.AnimSlidePlugin}]
                });
                this.overlay.prompt.render();
                Y.log('rendered prompt overlay', null, 'ButtonPush');

                this.overlay.prompt.get('boundingBox').setStyle('width', '100%');

                this.contentBox = this.overlay.prompt.get('contentBox');
                this.app.registeredOverlay.push(this.overlay.prompt);
            },

            switchToStep : function(step) {
                switch (step) {
                    case 1:
                        this.contentBox.one('.step-2').hide();
                        Y.one('#push_submit span').set('text', 'Next');
                        Y.one('#push_previous').hide();
                        this.contentBox.one('.step-1').show();
                        this.step = 1;
                        break;
                    case 2:
                        this.contentBox.one('.step-1').hide()
                        Y.one('#push_submit span').set('text', 'Submit');
                        Y.one('#push_previous').show();
                        this.contentBox.one('.step-2').show();
                        this.step = 2;
                        break;
                }
            },

            _bindEvents : function() {
                this.app.gateway.listen(Biscuit.Locator.rest.services.push.getfiles, Y.bind(this._onSecondStep, this));
                this.app.gateway.listen(Biscuit.Locator.rest.services.push.new, Y.bind(this._onSubmit, this));

                Y.one('#push_previous').on('click', function(e) {
                    e.halt();
                    this.switchToStep(1);
                }, this);

                Y.one('#push_cancel').on('click', function(e) {
                    e.halt();
                    this.overlay.prompt.hide();
                }, this);

                Y.one('#push_folder').on('click', function(e) {
                    if (this.get('checked')) {
                        Y.one('#push_folder_group_container').show();
                    } else {
                        Y.one('#push_folder_group_container').hide();
                    }
                });

                Y.one('#push_submit').on('click', this._onSubmitButtonClick, this);
            },

            _click : function() {
                this.toggle();
            },

            _onSubmitButtonClick : function(e) {
                var ticket          = Y.one('#push_ticket').get('value'),
                    datetime        = Y.one('#push_datetime').get('value'),
                    comment         = Y.one('#push_msg').get('value'),
                    pushPages       = Y.one('#push_pages').get('checked'),
                    pushFolder      = Y.one('#push_folder').get('checked'),
                    pushFolderGroup = Y.one('#push_folder_group').get('checked');

                var button = e.currentTarget;
                switch (this.step) {
                    case 1:
                        // check if every mandatory field has been filled
                        // there's a missing #!§% html5 validator api here
                        if (
                            !isNaN(parseInt(ticket))
                            && REGEX_DATETIME.test(datetime)
                            && (pushPages || pushFolder)
                        ) {
                            e.halt();
                            button.set('disabled', true).addClass(BUTTON_LOADING_CLASSNAME);

                            this.app.gateway.emit(Biscuit.Locator.rest.services.push.getfiles, { 'params' : {
                                'pushPages'       : pushPages ? 1 : 0,
                                'pushFolder'      : pushFolder ? 1 : 0,
                                'pushFolderGroup' : pushFolderGroup ? 1 : 0,
                            }});
                        } else {
                            // invalid input
                            return;
                        }
                    break;
                    case 2:
                        e.halt();

                        // get files
                        var files = this.contentBox.all('.step-2 .list input[type=checkbox]'), pushFiles = [];
                        files.each(function(file) {
                            if (file.get('checked')) {
                                pushFiles.push(file.getAttribute('data-filename'));
                            }
                        });

                        if (pushFiles.length === 0) {
                            Y.log("user didn't pick any file", null, 'ButtonPush');
                            return;
                        }

                        // define type
                        var type = null;
                        if (pushPages && pushFolder && pushFolderGroup) {
                            type = 'ALL_GROUP';
                        } else if (pushPages && pushFolder) {
                            type = 'ALL';
                        } else if (pushPages) {
                            type = 'PAGE';
                        } else if (pushFolder && pushFolderGroup) {
                            type = 'FOLDER';
                        } else if (pushFolder) {
                            type = 'FOLDER_GROUP';
                        }

                        Y.one('#push_submit').set('disabled', true).addClass(BUTTON_LOADING_CLASSNAME);
                        this.app.gateway.emit(Biscuit.Locator.rest.services.push.new, { 'params' : {
                            'date'    : datetime,
                            'type'    : type,
                            'ticket'  : ticket,
                            'comment' : comment ? comment : null,
                            'files'   : pushFiles.join('#')
                        }});
                        break;
                }
            },

            _onSecondStep : function(e, event, data, error) {
                Y.one('#push_submit').set('disabled', false).removeClass(BUTTON_LOADING_CLASSNAME);

                switch (error) {
                    case 'NO_DATA':
                        Y.log('nothing to deliver', null, 'ButtonPush');
                        this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "This website is already synchronized.");
                        return;
                }
                data = data[0];

                // build html list
                var list = this.contentBox.one('.step-2 .list'), html = [], i = 0;
                for (var file in data) {
                    html.push(Y.Node.create('<li><input type="checkbox" id="push-filename-' + i + '" data-filename="' + file + '" /><label for="push-filename-' + i + '">' + data[file] + '</label></li>'));
                    i++;
                }
                list.get('children').remove();
                list.append(Y.all(html));

                // everything is ok, switch to step 2
                this.switchToStep(2);
            },

            _onSubmit : function(e, event, data, error) {
                Y.one('#push_submit').set('disabled', false).removeClass(BUTTON_LOADING_CLASSNAME);

                switch (error) {
                    case 'NO_DATA':
                        //Y.log('push query failed', null, 'ButtonPush');
                        //this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "This website is already synchronized.");
                        return;
                }

                this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "Your push query has been submitted successfully.");
                this.overlay.prompt.hide();
            },

            toggle : function() {
                if (this.overlay.prompt.get('visible')) {
                    this.overlay.prompt.hide();
                } else {
                    this.overlay.prompt.show();

                    // sets first step as visible
                    this.switchToStep(1);

                    // sets current datetime
                    var date = Y.DataType.Date.format(new Date(), {format:'%d-%m-%Y %T'});
                    Y.one('#push_datetime').set('value', date);

                    Y.one('#push_ticket').focus();
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonPush = ButtonPush;
}, '3.3.0', {requires:['node', 'overlay', 'datatype-date', 'overlay-fx-slide-plugin']});