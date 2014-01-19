var slides = slides || {};

(function(ns) {
    var SVG_NS = "http://www.w3.org/2000/svg";
    var INKSCAPE_NS ="http://www.inkscape.org/namespaces/inkscape"
    var SLIDES_NS ="http://www.inkscape.org/namespaces/slides"

    ns.SlideViewer = function(svgRoot) {
        this.svgRoot = svgRoot;

        clipPathElement = document.createElementNS(SVG_NS, "clipPath");
        clipPathElement.setAttribute("id", "clippath-" + svgRoot.getAttribute("id"));
        this.clipRectElement = document.createElementNS(SVG_NS, "rect");

        this.viewportElement = document.createElementNS(SVG_NS, "g");
        this.viewportElement.setAttribute("clip-path", 
                "url(#" + clipPathElement.getAttribute("id") + ")");

        this.labelElement = document.createElementNS(SVG_NS, "text");
        this.labelElement.style.display = "inline";
        this.labelElement.style.fillOpacity = '0.50';
        this.labelElement.setAttribute("x", "20");        
        this.labelElement.setAttribute("y", "20"); 
        /* reparent all of the inkscape layers */
        layers = svgRoot.querySelectorAll("svg>g");
        reparentLayers(layers, this.viewportElement);

        /* add the clippath and viewport elements */
        svgRoot.appendChild(clipPathElement);
        svgRoot.appendChild(this.viewportElement);
        svgRoot.appendChild(this.labelElement);

        /* find the control layer */
        controlLayerId = svgRoot.getAttribute("inkslides-control-layer") || "slides-control";
        controlPathId = svgRoot.getAttribute("inkslides-control-path") || "slides-path";
        controlLayer = svgRoot.querySelector("g[id=" + controlLayerId + "]");
        /* hide the control layer */
        controlLayer.setAttribute("style", "visibility:hidden;");

        this.path = controlLayer.querySelector("path[id=" + controlPathId +"]");
        slides = controlLayer.querySelectorAll("rect");
        this.slides = sortSlidesByArea(this, slides);

        this.controlNodes = getPathNodes(this.path);
        
        /* set default size and show the first slide */
        this.currentSlide = 0;

        this.resize(window.innerWidth, window.innerHeight);
    };

    ns.SlideViewer.prototype.findSlideByPoint = function(point) {
        var i;
        var slide;
        var bb;
        x = point.x;
        y = point.y;
        for(i = 0; i < this.slides.length; i ++) {
            slide = this.slides[i];
            bb = this.getSlideBBox(slide, this.viewportElement);
            console.log("matching " + x + ", " + y 
                     +  " in " + slide.getAttribute('id') 
                     + "  " +  bb.x + ", " + (1.0 * bb.x + bb.width)
                     +  "; " + bb.y + ", " + (1.0 * bb.y + bb.height));
            if (x >= bb.x && x <= bb.x + bb.width
            &&  y >= bb.y && y <= bb.y + bb.height) {
                return slide;
            }
        }
        console.log("slide is not found");
        return null;
    };

    ns.SlideViewer.prototype.jumpTo = function(slideid) {
        if(slideid > this.controlNodes.length - 1)  {
            slideid = this.controlNodes.length - 1;
        }
        if(slideid < 0) {
            slideid = 0;
        }
        this.currentSlide = slideid;
        viewSlide(this, this.currentSlide);
    };

    ns.SlideViewer.prototype.nextSlide = function() {
        if(this.currentSlide == this.controlNodes.length - 1) return;
        this.currentSlide ++;
        viewSlide(this, this.currentSlide);
    };

    ns.SlideViewer.prototype.prevSlide = function() {
        if(this.currentSlide == 0) return;
        this.currentSlide --;
        viewSlide(this, this.currentSlide);
    };

    ns.SlideViewer.prototype.resize = function(width, height) {
        this.width = width;
        this.height = height;
        viewSlide(this, this.currentSlide);
    };

    ns.SlideViewer.prototype.showLabel = function() {
        this.labelElement.style.display = "inline";
    };

    ns.SlideViewer.prototype.hideLabel = function() {
        this.labelElement.style.display = "none";
    };

    ns.SlideViewer.prototype.getSlideBBox = function (slide) {
        /* this will return the BBox in the user coordinate of the
         * viewport element*/
        transform = slide.getTransformToElement(this.viewportElement);
        return applyMatrixToBBox(slide.getBBox(), transform);
        /*
        return { 
                x: slide.getAttribute("x") * 1.0,
                y: slide.getAttribute("y") * 1.0,
                width: slide.getAttribute("width") * 1.0,
                height: slide.getAttribute("height") * 1.0
            };
        */
    }

    function viewSlide(viewer, slideid) {
        var point = viewer.controlNodes[slideid];
        var slide = viewer.findSlideByPoint(point);

        var scale = 1.0;
        var bbox = viewer.getSlideBBox(slide, viewer.viewportElement);

        var ww = viewer.width;
        var wh = viewer.height;
        viewer.svgRoot.setAttribute("width", ww);
        viewer.svgRoot.setAttribute("height", wh);
        var wscale = 1.0 * ww / bbox.width;
        var hscale = 1.0 * wh / bbox.height;
        if (wscale > hscale) {
            scale = hscale;
        } else {
            scale = wscale;
        }

        var cx = bbox.x + bbox.width / 2;
        var cy = bbox.y + bbox.height / 2;

        var translateX0 = -cx; 
        var translateY0 = -cy; 
        
        var translateX = ww / 2; 
        var translateY = wh / 2; 

        viewer.clipRectElement.setAttribute("x", bbox.x);
        viewer.clipRectElement.setAttribute("y", bbox.y);
        viewer.clipRectElement.setAttribute("width", bbox.width);
        viewer.clipRectElement.setAttribute("height", bbox.height);

        viewer.viewportElement.setAttribute("transform",
                "translate(" + translateX + "," + translateY + ")" + 
                "scale(" + scale + ")" +
                "translate(" + translateX0 + "," + translateY0 + ")" + 
                "");
        viewer.labelElement.innerHTML = (viewer.currentSlide + 1) + "/" + viewer.slides.length;
    };

    function sortSlidesByArea(viewer, slides) {
        var arr = [];
        var i;
        var n;
        for(i = 0, n; n = slides[i]; ++i) arr.push(n);
        arr.sort(function (a, b) {
            a1 = viewer.getSlideBBox(a);
            b1 = viewer.getSlideBBox(b);
            return a1.width * a1.height - b1.width * b1.height;
        });
        return arr;
    }

    function reparentLayers(layers, viewport) {
        var i;
        var childNodes = document.documentElement.childNodes;
        var element;
        for (i = 0; i < layers.length; i ++) {
            element = layers[i];
            element.parentNode.removeChild(element);
            viewport.appendChild(element);
        }
    }

    function getPathNodes(path) {
        var j;
        var tmppath = document.createElementNS(SVG_NS, "path");
        var seg;
        var nodes = [];
        for(j = 0; j < path.pathSegList.length; j++) {
            seg = path.pathSegList[j];
            tmppath.pathSegList.appendItem(seg);
            nodes.push(path.getPointAtLength(tmppath.getTotalLength()));
        }
        return nodes;
    }

    function applyMatrixToBBox(bbox, m) {
        return { 
                x: bbox.x * m.a + bbox.y * m.c + m.e,
                y: bbox.x * m.b + bbox.y * m.d + m.f,
                width: bbox.width * m.a + bbox.height * m.c,
                height: bbox.width * m.b + bbox.height * m.d
            };
    }
})(slides);

window.addEventListener("load", function() {

    var SODIPODI_NS ="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
    var svgroot = document.documentElement;
    var viewer = new slides.SlideViewer(svgroot);

    var namedview = document.getElementsByTagNameNS(SODIPODI_NS, "namedview")[0];
    var pagecolor = namedview.getAttribute("pagecolor");

    svgroot.style.backgroundColor = pagecolor;

    window.addEventListener("resize", function() {
        viewer.resize(window.innerWidth, window.innerHeight);
    });

    viewer.showLabel();
    window.setTimeout(function() {
        viewer.hideLabel();
    }, 2000);

    document.addEventListener("keypress", function(event) {
        console.log(event);
        var keyCode = event.charCode || event.keyCode;
        viewer.showLabel();
        switch(keyCode) {
            case 36: /* Home */
                viewer.jumpTo(0);
                break;
            case 35: /* End */
                viewer.jumpTo(viewer.slides.length - 1);
                break;
            case 32: /* Space */
            case 34: /* PgDN*/
            case 39: /* Right */
            case 40: /* Down */
                viewer.nextSlide();
            break;
            case 33: /* PgUp*/
            case 37: /* Left */
            case 38: /* Up */
                viewer.prevSlide();
            break;
        }            
        window.setTimeout(function() {
            viewer.hideLabel();
        }, 2000);
        event.preventDefault();
    }, false);

}, false);

