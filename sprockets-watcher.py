#!/usr/bin/env python

import pyinotify
import subprocess

wm = pyinotify.WatchManager()
mask = pyinotify.IN_DELETE | pyinotify.IN_CREATE | pyinotify.IN_MODIFY

class EventHandler(pyinotify.ProcessEvent):
    def process_default(self, event):
        if event.pathname in ("/home/httpd/softgallery/biscuit/public/js/editor-concat.js", "/home/httpd/softgallery/biscuit/public/js/dashboard-concat.js"):
            return

        if ".svn" in event.pathname:
        	return
            
        print event.pathname, "updated"
        subprocess.call(['/bin/bash', '/home/httpd/softgallery/biscuit/sprockets.sh'])

handler = EventHandler()
notifier = pyinotify.Notifier(wm, handler)
wdd = wm.add_watch('/home/httpd/softgallery/biscuit/public/js', mask, rec=True)

notifier.loop()