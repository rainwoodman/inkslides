#!/usr/bin/env python2

import sys, os

# We will use the inkex module with the predefined Effect base class.
import inkex
import simplestyle
import re

NS_URI = u"http://github.com/rainwoodman/inkslides/ns"

javascript = file(os.path.join(os.path.dirname(__file__), "inkslides.js")).read()

def_color = "#0f0"
def_opacity = 0.5

class Inkslides(inkex.Effect):
    def __init__(self):
        inkex.Effect.__init__(self)
        inkex.NSS[u"inkslides"] = NS_URI

        self.model = None
        self.OptionParser.add_option('-d', '--direction', 
                action='store', type='string', dest='direction',
                default="left-right")

    def style_path(self, node):
        style = simplestyle.parseStyle(node.get("style"))
        style['opacity'] = 1.0
        style['stroke-opacity'] = def_opacity
        style['stroke'] = def_color
        style['stroke-width'] = 5

        style['marker-start'] = "url(#inkslides-marker-start)"
        style['marker-mid'] = "url(#inkslides-marker)"
        style['marker-end'] = "url(#inkslides-marker-end)"
        node.set("style", simplestyle.formatStyle(style))
        
    def add_marker(self, name, symbol):
        """ this will create the marker definations """
        marker = self.getElementById(name) 
        if marker is None:
            defs = self.xpathSingle('/svg:svg//svg:defs')
            if defs == None:
                defs = inkex.etree.SubElement(self.document.getroot(), inkex.addNS('defs','svg'))
        
            marker = inkex.etree.SubElement(defs, inkex.addNS('marker','svg'))

        marker.clear()
        marker.set("id", name)
        marker.set("orient", "auto")
        if symbol == "circle":
            markerpath = inkex.etree.SubElement(marker, inkex.addNS('circle','svg'))
            markerpath.set("cx", "0")
            markerpath.set("cy", "0")
            markerpath.set("r", "2")
        elif symbol == "rect":
            markerpath = inkex.etree.SubElement(marker, inkex.addNS('rect','svg'))
            markerpath.set("x", "-2")
            markerpath.set("y", "-2")
            markerpath.set("width", "4")
            markerpath.set("height", "4")
            markerpath.set("transform", "rotate(45)")
        elif symbol == "line":
            markerpath = inkex.etree.SubElement(marker, inkex.addNS('rect','svg'))
            markerpath.set("x", "-1")
            markerpath.set("y", "-2")
            markerpath.set("width", "2")
            markerpath.set("height", "4")

        markerpath.set("style", 
              "fill: %s; fill-opacity:%g" % (def_color, def_opacity))

        markerpath = inkex.etree.SubElement(marker, inkex.addNS('circle','svg'))
        markerpath.set("cx", "0")
        markerpath.set("cy", "0")
        markerpath.set("r", "0.4")
         
    def effect(self):

        key = list(self.selected.keys())[0]
        node = self.selected[key]

        layer = self.findLayerNode(node)

        layer.set("style", "opacity:0.5")

        scriptnode = self.getElementById("inkslides-script")
        if scriptnode is None:
            scriptnode = inkex.etree.Element(inkex.addNS("script", "svg"))
            scriptnode.set("id","inkslides-script")
            self.document.getroot().append(scriptnode)
        scriptnode.text = javascript
        self.document.getroot().set("inkslides-control-layer", layer.get("id"))
        self.document.getroot().set("inkslides-control-direction", self.options.direction)

    def findLayerNode(self, node):
        if node.get(inkex.addNS('groupmode','inkscape')) == 'layer':
            return node
        else:
            return self.findLayerNode(self.getParentNode(node))

# Create effect instance
effect = Inkslides()
effect.affect()

