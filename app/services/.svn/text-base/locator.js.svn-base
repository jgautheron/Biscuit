exports.rest = {
    // rest platform configuration

    BASE_URI        : 'http://tpleditor.devjgautheron.telechargement.fr:81/api/',
    FORMATS         : ['xml','json'],
    DEFAULT_FORMAT  : 'json',

    // services
    services : {
        user : {
            authenticate : {
                name   : 'user.authenticate',
                route  : 'user/authenticate',
                method : 'post',
                params : ['user', 'password']
            },
            rights : {
                name   : 'user.rights',
                route  : 'user/getRights',
                method : 'get',
                params : ['user']
            }
        },
        lock : {
            get : {
                name   : 'lock.get',
                route  : 'lock/getLock',
                method : 'get',
                params : ['Server__']
            },
            set : {
                name   : 'lock.set',
                route  : 'lock/setLock',
                method : 'post',
                params : ['Server__']
            },
            unset : {
                name   : 'lock.unset',
                route  : 'lock/unLock',
                method : 'post',
                params : ['Server__']
            }
        },
        push : {
            getfiles : {
                name   : 'push.getfiles',
                route  : 'push/getFiles',
                method : 'get',
                params : ['Server__', 'Page__', 'pushPages', 'pushFolder', 'pushFolderGroup']
            },
            getqueries : {
                name   : 'push.getqueries',
                route  : 'push/getQueries',
                method : 'get',
                params : ['pushed', 'date']
            },
            new : {
                name   : 'push.new',
                route  : 'push/add',
                method : 'post',
                params : ['Server__', 'Page__', 'date', 'type', 'ticket', 'comment', 'files']
            },
            deliver : {
                name   : 'push.deliver',
                route  : 'push/deliver',
                method : 'post',
                params : ['Push_Query__']
            },
            cancel : {
                name   : 'push.cancel',
                route  : 'push/cancel',
                method : 'post',
                params : ['Push_Query__']
            }
        },
        version : {
            template : {
                name   : 'version.template',
                route  : 'version/getTemplate',
                method : 'get',
                params : ['Server__', 'Page__', 'Template__', 'Posix_Language__']
            },
            templatetype : {
                name   : 'version.templatetype',
                route  : 'version/getTemplateType',
                method : 'get',
                params : ['Server__', 'Page__', 'Template__']
            }
        },
        server : {
            list : {
                name   : 'server.list',
                route  : 'server/getList',
                method : 'get'
            },
            languages : {
                name   : 'server.languages',
                route  : 'server/getLanguages',
                method : 'get',
                params : ['Server__']
            }
        },
        page : {
            list : {
                name   : 'page.list',
                route  : 'page/getList',
                method : 'get',
                params : ['Server__']
            },
            new : {
                name   : 'page.new',
                route  : 'page/addNew',
                method : 'post',
                params : ['Server__', 'Page_Name']
            },
            compile : {
                name   : 'page.compile',
                route  : 'page/compile',
                method : 'post',
                params : ['Server__', 'Page__']
            }
        },
        templatetype : {
            getproperties : {
                name   : 'templatetype.getproperties',
                route  : 'template/getProperties',
                method : 'get',
                params : ['Server__', 'Page__', 'Template__', 'Template_Type__']
            },
            gettypes : {
                name   : 'templatetype.gettypes',
                route  : 'template/getTypes',
                method : 'get',
                params : []
            },
            setproperty : {
                name   : 'templatetype.setproperty',
                route  : 'template/setProperty',
                method : 'post',
                params : ['Server__', 'Page__', 'Template__', 'Posix_Language__', 'Template_Type__', 'Key', 'Value']
            },
            setproperties : {
                name   : 'templatetype.setproperties',
                route  : 'template/setProperties',
                method : 'post',
                params : ['Server__', 'Page__', 'Template__', 'Template_Type__', 'Options']
            }
        },
        template : {
            list : {
                name   : 'template.list',
                route  : 'template/getList',
                method : 'get',
                params : ['Server__', 'Page__']
            },
            content : {
                name   : 'template.content',
                route  : 'template/getContent',
                method : 'get',
                params : ['Server__', 'Page__', 'Template__', 'Posix_Language__']
            },
            save : {
                name   : 'template.save',
                route  : 'template/setContent',
                method : 'post',
                params : ['Server__', 'Page__', 'Template__', 'Posix_Language__', 'content']
            },
            new : {
                name   : 'template.new',
                route  : 'template/newTemplate',
                method : 'post',
                params : ['Server__', 'Page__', 'Template__', 'Posix_Language__']
            },
            delete : {
                name   : 'template.delete',
                route  : 'template/deleteTemplate',
                method : 'post',
                params : ['Server__', 'Page__', 'Template__', 'Posix_Language__']
            },
            rename : {
                name   : 'template.rename',
                route  : 'template/setName',
                method : 'post',
                params : ['Server__', 'Page__', 'Template__', 'Name']
            },
            addLanguage : {
                name   : 'template.addLanguage',
                route  : 'template/addLanguage',
                method : 'post',
                params : ['Server__', 'Page__', 'Template__', 'Posix_Language__']
            },
            deleteLanguage : {
                name   : 'template.deleteLanguage',
                route  : 'template/deleteLanguage',
                method : 'post',
                params : ['Server__', 'Page__', 'Template__', 'Posix_Language__']
            }
        }
    }
};
