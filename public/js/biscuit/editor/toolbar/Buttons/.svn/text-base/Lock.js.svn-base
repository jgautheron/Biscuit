YUI.add('toolbar-button-lock', function(Y) {
    function ButtonLock() {
        this._initButtonLock();
    }

    ButtonLock.prototype = {
        _initButtonLock : function() {
            this.lock.parent = this;
            this.lock._init();
        },

        lock : {
            overlay : {},

            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.lock');
                this.container = this.app.editor.srcNode;

                this._render();
                this._bindEvents();
            },

            _render : function() {
                this.overlay.transparent = new Y.Overlay({
                    srcNode: '#transparent-overlay',
                    visible: false,
                    shim: false
                });
                this.overlay.transparent.render();
                Y.log('rendered transparent overlay', null, 'ButtonLock');

                this.overlay.prompt = new Y.Overlay({
                    srcNode: '#lock-overlay',
                    visible: false,
                    shim: false,
                    plugins : [{fn:Y.AnimSlidePlugin}]
                });
                this.overlay.prompt.render();
                Y.log('rendered prompt overlay', null, 'ButtonLock');
                
                this.overlay.prompt.get('boundingBox').setStyle('width', '100%');

                this.app.registeredOverlay.push(this.overlay.transparent);
                this.app.registeredOverlay.push(this.overlay.prompt);
            },

            _bindEvents : function() {
                this.app.gateway.listen(Biscuit.Locator.rest.services.lock.unset, Y.bind(this.unbind, this));
                this.app.gateway.listen(Biscuit.Locator.rest.services.lock.set, Y.bind(function() {
                    this.overlay.prompt.hide();
                    this.app.current.isLocked = true;
                    this.button.addClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                }, this));

                Y.one('#lock_cancel').on('click', function() {
                    this.overlay.prompt.hide();
                }, this);

                Y.one('#lock_submit').on('click', function() {
                    var getLockType = function() {
                        var t = [Y.one('#lock_type_1'), Y.one('#lock_type_2'), Y.one('#lock_type_3')], lockType;
                        t.forEach(function(el) {
                            if (el.get('checked')) {
                                lockType = el.get('value');
                            }
                        });
                        return lockType;
                    };
                    var lockType = getLockType(),
                        lockMessage = Y.one('#lock_msg').get('value');

                    if (!lockType) {
                        Y.log('no lock type defined', 'warn', 'ButtonLock');
                        return;
                    }

                    var params = {};
                    switch (lockType) {
                        case '3':
                            params['Template__'] = this.app.current.template;
                        case '2':
                            params['Page__'] = this.app.current.page;
                            break;
                    }

                    if (lockMessage) {
                        params['comment'] = lockMessage;
                    }

                    this.app.gateway.emit(Biscuit.Locator.rest.services.lock.set, { 'params' : params});
                }, this);
            },

            _click : function() {
                this.toggle();
            },

            unbind : function() {
                this.app.current.isLocked = false;
                this.app.current.lockData = {};
                this.button.removeClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                this.overlay.transparent.hide();
                Y.one('.context-template').show();
            },

            bind : function(data) {
                this.app.current.isLocked = true;
                this.app.current.lockData = data;
                this.button.addClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);

                if (this.app.user.name === data['User']) {
                    this.overlay.transparent.hide();
                    return;
                }

                Y.one('.context-template').hide();

                var notice = this.overlay.transparent.bodyNode.one('.notice');
                if (notice) {
                    notice.get('children').remove();
                } else {
                    notice = Y.Node.create('<div class="notice"></div>');
                }
                var message = [
                    '<h3>Template locked by <span>' + data['User'] + '</span></h3>',
                    '<br />',
                    '<em>' + data['StampWords'] + '</em>',
                    '<p class="spaced">The content of this template has been locked and is therefore not writable.</p>'
                ];

                // user comment
                data['Comment'] = data['Comment'] === '' ? null : data['Comment'];
                if (data['Comment'] !== null) {
                    message.push('<h4>Reason stated</h4><p class="comment">' + data['Comment'] + '</p>');
                } else {
                    message.push('<h4>No reason stated</h4>');
                }

                // lock level
                message.push('<h4>Locked on the ' + data['LockLevel'] + ' level</h4>');

                // rights: unlock?
                if (data['UserLevel'] < this.app.user.level) {
                    message.push('<p>You don\'t have the required rights to unlock this level.</p>');
                }

                var message = Y.Node.create(message.join(''));
                notice.appendChild(message);
                this.overlay.transparent.bodyNode.appendChild(notice);

                var WidgetPositionAlign = Y.WidgetPositionAlign;
                this.overlay.transparent.bodyNode.get('parentNode').setStyle('width', this.container.get('offsetWidth'));
                this.overlay.transparent.bodyNode.get('parentNode').setStyle('height', this.container.get('offsetHeight'));
                this.overlay.transparent.set('align', {
                    node: this.container,
                    points: [WidgetPositionAlign.TL, WidgetPositionAlign.TL]
                });
                this.overlay.transparent.show();
            },

            toggle : function() {
                if (this.button.hasClass(this.parent.CLASSNAMES.BUTTON_ACTIVE)) {
                    if (this.app.current.isLocked) {
                        if (this.app.current.lockData['UserLevel'] < this.app.user.level) {
                            Y.log('tried to unlock without the matching rights', 'warn', 'ButtonLock');
                            this.app.notifier.show(this.app.notifier.TYPES.FORBIDDEN, "You don't have the required rights to unlock this template.");
                            return;
                        }

                        var lockLevel = this.app.current.lockData['LockLevel'], params = {};
                        switch (lockLevel) {
                            case 'template':
                                params['Template__'] = this.app.current.template;
                            case 'page':
                                params['Page__'] = this.app.current.page;
                                break;
                        }
                        this.app.gateway.emit(Biscuit.Locator.rest.services.lock.unset, { 'params' : params });
                    } else {
                        Y.log('tried to unlock the unlocked', 'error', 'ButtonLock');
                    }
                } else {
                    this.overlay.prompt.show();
                    Y.one('#lock_msg').focus();
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonLock = ButtonLock;
}, '3.3.0', {requires:['node', 'overlay', 'overlay-fx-slide-plugin']});