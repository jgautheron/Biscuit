#!/bin/bash
cd /home/httpd/softgallery/biscuit/public/js

/home/rev/.gem/ruby/1.9.1/bin/sprocketize \
			yui/node++.js \
			yui/propertyeditor.js \
			yui/overlay-fx-slide-plugin.js \
			biscuit/editor/common/start.js \
			biscuit/editor/common/ObjectExtend.js \
			biscuit/editor/common/History.js \
			biscuit/editor/common/Gateway.js \
			biscuit/editor/common/DataStore.js \
			biscuit/editor/common/LocalStore.js \
			biscuit/editor/common/Notifier.js \
			biscuit/editor/common/Editor.js \
			biscuit/editor/common/Settings.js \
			biscuit/editor/common/Monitoring.js \
			biscuit/editor/nav/top/*.js \
			biscuit/editor/toolbar/Buttons/*.js \
			biscuit/editor/toolbar/Toolbar.js \
			biscuit/editor/actions/Buttons/*.js \
			biscuit/editor/actions/Templates.js \
			biscuit/editor/common/Biscuit.js \
			biscuit/editor/debug/Console.js \
			biscuit/editor/common/end.js > editor-concat.js

/home/rev/.gem/ruby/1.9.1/bin/sprocketize \
			biscuit/dashboard/start.js \
			biscuit/dashboard/Gateway.js \
			biscuit/dashboard/DataStore.js \
			biscuit/dashboard/Notifier.js \
			biscuit/dashboard/Icons.js \
			biscuit/dashboard/Icons/*.js \
			biscuit/dashboard/Dashboard.js \
			biscuit/dashboard/Console.js \
			biscuit/dashboard/end.js > dashboard-concat.js

cd -
