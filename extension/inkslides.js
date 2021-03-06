var slides = slides || {};

(function(ns) {
    var SVG_NS = "http://www.w3.org/2000/svg";
    var INKSCAPE_NS ="http://www.inkscape.org/namespaces/inkscape"
    var SLIDES_NS ="http://www.inkscape.org/namespaces/slides"

    ns.Blinker = function(svgelement) {
        this.duration = 0;
        this.element = svgelement;
        this.timeoutID = null;
    };

    ns.Blinker.prototype.show = function (duration) {
        this.duration = duration;
        if (this.timeoutID) {
            window.clearTimeout(this.timeoutID);
        }
        if (this.duration > 0) {
            this.element.style.visibility = "visible";
        } else {
            this.element.style.visibility = "hidden";
        }

        /* Note that PhantomJS < 2.0 do not .bind(), 
         * so we pass in the element directly.
         * see, 
         * https://github.com/ariya/phantomjs/issues/10522
         * */

        var func = function(element) {
            element.style.visibility = "hidden";
        };
        this.timeoutID = window.setTimeout(
            func, 
            this.duration, this.element
        );
    };

    function nameToRGB(name) {
        // Idea from https://css-tricks.com/converting-color-spaces-in-javascript/
        var fake = document.createElementNS(SVG_NS, "rect");
        fake.style.color = name;
        return fake.style.color;
    }

    function setOSDstyle(element) {
        element.style.fillOpacity = '0.50';
        element.style.stroke = "green";
        element.style.fill = "green";
        element.style.color = "green";
        element.style.fontFamily = "monospace";
        element.style.fontSize = "2em";
    }

    function fixtspan(root) {
        var tspans = root.querySelectorAll("tspan");
        var i;
        var tspan;
        for(i = 0; i < tspans.length; i ++) {
            tspan = tspans[i];
            if(tspan.style.whiteSpace == "normal") {
                /* inkscape tends to write a lot of redundant styles; whiteSpace breaks webkit */
                /* https://github.com/ariya/phantomjs/issues/13625 */
                console.log("Fixing 'whiteSpace=normal;' for phantomJS #13625");
                tspan.style.whiteSpace = null;
            } 
        }

    }

    ns.SlideViewer = function(svgRoot) {
        this.svgRoot = svgRoot;

        fixtspan(this.svgRoot);

        this.svgRoot.removeAttribute('viewBox');
        this.contentElement = document.createElementNS(SVG_NS, "g");

        this.clipRectElement = document.createElementNS(SVG_NS, "rect");
        
        this.clipPathElement = document.createElementNS(SVG_NS, "clipPath");
        this.clipPathElement.setAttribute("id", "clippath-" + svgRoot.getAttribute("id"));
        this.clipPathElement.appendChild(this.clipRectElement);
        
        this.viewportElement = document.createElementNS(SVG_NS, "g");
        
        
        this.scaleElement = document.createElementNS(SVG_NS, "g");

        this.scaleElement.appendChild(this.viewportElement);

        this.contentElement.appendChild(this.scaleElement);

        this.labelElement = document.createElementNS(SVG_NS, "text");
        this.labelElement.style.display = "inline";
        setOSDstyle(this.labelElement);

        this.translateAnimation = document.createElementNS(SVG_NS, "animateTransform");
        this.translateAnimation.setAttribute('attributeName', 'transform');
        this.translateAnimation.setAttribute('type', 'translate');
        this.translateAnimation.setAttribute('begin', 'indefinite');
        this.translateAnimation.setAttribute('dur', '1s');
        this.translateAnimation.setAttribute('fill', 'freeze');
        this.viewportElement.appendChild(this.translateAnimation);

        this.scaleAnimation = document.createElementNS(SVG_NS, "animateTransform");
        this.scaleAnimation.setAttribute('attributeName', 'transform');
        this.scaleAnimation.setAttribute('type', 'scale');
        this.scaleAnimation.setAttribute('begin', 'indefinite');
        this.scaleAnimation.setAttribute('dur', '1s');
        this.scaleAnimation.setAttribute('fill', 'freeze');
        this.scaleElement.appendChild(this.scaleAnimation);

        this.scaleAnimation2 = document.createElementNS(SVG_NS, "animateTransform");
        this.scaleAnimation2.setAttribute('attributeName', 'transform');
        this.scaleAnimation2.setAttribute('type', 'scale');
        this.scaleAnimation2.setAttribute('begin', 'indefinite');
        this.scaleAnimation2.setAttribute('dur', '3s');
        this.scaleAnimation2.setAttribute('fill', 'freeze');
        this.clipRectElement.appendChild(this.scaleAnimation2);

        this.labelBlinker = new ns.Blinker(this.labelElement);

        this.inputElement = document.createElementNS(SVG_NS, "text");
        this.inputElement.style.display = "inline";
        /* position set with resize */
        setOSDstyle(this.inputElement); 

        this.inputBlinker = new ns.Blinker(this.inputElement);

        /* reparent all of the inkscape layers */
        layers = svgRoot.querySelectorAll("svg>g");
        reparentLayers(layers, this.viewportElement);

        /* add the clippath and viewport elements */
        svgRoot.appendChild(this.clipPathElement);
        svgRoot.appendChild(this.contentElement);
        svgRoot.appendChild(this.labelElement);
        svgRoot.appendChild(this.inputElement);
        /* find the control layer */
        controlLayerId = svgRoot.getAttribute("inkslides-control-layer") || "slides-control";
        controlDirection = svgRoot.getAttribute("inkslides-control-direction") || "left-right";
        // controlPathId = svgRoot.getAttribute("inkslides-control-path") || "slides-path";
        controlLayer = svgRoot.querySelector("g[id=" + controlLayerId + "]");
        /* hide the control layer */
        controlLayer.setAttribute("style", "visibility:hidden;");
        hiddenSlidesFill = nameToRGB(svgRoot.getAttribute("inkslides-hidden-slides-fill"));

        slides = controlLayer.querySelectorAll("*");
        this.slides = sortSlidesByPosition(this, slides, controlDirection, hiddenSlidesFill);

        /* set default size and show the first slide */
        this.currentSlide = 0;

        this.resize(window.innerWidth, window.innerHeight);
    };

    ns.SlideViewer.prototype.jumpTo = function(slideid) {
        if(slideid > this.slides.length - 1)  {
            slideid = this.slides.length - 1;
        }
        if(slideid < 0) {
            slideid = 0;
        }
        viewSlide(this, slideid);
    };

    ns.SlideViewer.prototype.jumpToQuick = function(slideid) {
        if(slideid > this.slides.length - 1)  {
            slideid = this.slides.length - 1;
        }
        if(slideid < 0) {
            slideid = 0;
        }
        viewSlideQuick(this, slideid);
    };

    ns.SlideViewer.prototype.nextSlide = function() {
        if(this.currentSlide == this.slides.length - 1) return;
        viewSlide(this, this.currentSlide + 1);
    };

    ns.SlideViewer.prototype.prevSlide = function() {
        if(this.currentSlide == 0) return;
        viewSlide(this, this.currentSlide - 1);
    };

    ns.SlideViewer.prototype.processInput = function(keycode) {
        var text = this.inputElement.innerHTML;
        switch(keycode) {
            case 36: /* Home */
                this.jumpTo(0);
                break;
            case 35: /* End */
                this.jumpTo(this.slides.length - 1);
                break;
            case 32: /* Space */
            case 34: /* PgDN*/
            case 39: /* Right */
            case 40: /* Down */
                this.nextSlide();
                break;
            case 33: /* PgUp*/
            case 37: /* Left */
            case 38: /* Up */
                this.prevSlide();
                break;
            case 48:
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57:
                /* 0 - 9 */
                var digit = keycode - 48;
                this.inputElement.innerHTML = text + digit;
                this.inputBlinker.show(2000);
                console.log("input = " + text);
                console.log("digit = " + digit);
                break;
            case 27: /* ESCAPE */
                this.inputElement.innerHTML = "";
                this.inputBlinker.show(2000);
                console.log("input = " + text);
                break;
            case 8: /* BACKSPACE */ if (text.length > 0) {
                    this.inputElement.innerHTML = text.substr(0, text.length - 1);
                }
                this.inputBlinker.show(2000);
                console.log("input = " + text);
                break; 
            case 13: /* ENTER */
                console.log("input = " + text);
                this.inputElement.innerHTML = "";
                var slide = parseInt(text);
                this.jumpTo(slide - 1);
                this.inputBlinker.show(100);
                break;
            default:
                return false;
        } 
        return true;
    };
    ns.SlideViewer.prototype.resize = function(width, height) {
        this.width = width;
        this.height = height;
        this.svgRoot.setAttribute("width", width);
        this.svgRoot.setAttribute("height", height);
        viewSlide(this, this.currentSlide);
        this.inputElement.setAttribute("x", width / 2 - 20);        
        this.inputElement.setAttribute("y", height / 2 - 20); 
        this.labelElement.setAttribute("x", "80");        
        this.labelElement.setAttribute("y", "80"); 
    };

    ns.SlideViewer.prototype.disableClipPath = function () {
        this.viewportElement.removeAttribute("clip-path");
    };

    ns.SlideViewer.prototype.enableClipPath = function () {
        this.viewportElement.setAttribute("clip-path", 
                "url(#" + this.clipPathElement.getAttribute("id") + ")");
    };

    ns.SlideViewer.prototype.getSlideBBox = function (slide) {
        /* this will return the BBox in the user coordinate of the
         * viewport element*/
        transform = slide.getTransformToElement(this.viewportElement);
        return applyMatrixToBBox(slide.getBBox(), transform);
    };

    ns.SlideViewer.prototype.getSlideTransform = function (slide) {
        var scale = 1.0;
        var bbox = this.getSlideBBox(slide, this.viewportElement);

        var ww = this.width;
        var wh = this.height;
        var wscale = 1.0 * ww / bbox.width;
        var hscale = 1.0 * wh / bbox.height;
        if (wscale > hscale) {
            scale = hscale;
        } else {
            scale = wscale;
        }

        var cx = bbox.x + bbox.width * 0.5;
        var cy = bbox.y + bbox.height * 0.5;

        var translateX0 = -cx; 
        var translateY0 = -cy; 
        
        var translateX = parseInt(ww * 0.5); 
        var translateY = parseInt(wh * 0.5); 

        return { X:translateX, Y:translateY, X0:translateX0, Y0:translateY0, scale:scale };
    };

    function viewSlide(viewer, slideid) {
        var oldslide = viewer.slides[viewer.currentSlide];
        var slide = viewer.slides[slideid];
        var bbox = viewer.getSlideBBox(slide, viewer.viewportElement);
        var transform = viewer.getSlideTransform(slide);
        var oldtransform = viewer.getSlideTransform(oldslide);

        viewer.labelBlinker.show(1000);
        
        viewer.translateAnimation.endElement();
        viewer.scaleAnimation.endElement();

        viewer.contentElement.setAttribute("transform",
                "translate(" + transform.X + "," + transform.Y + ")" + 
                "");

        viewer.scaleAnimation.setAttribute("from", oldtransform.scale);
        viewer.scaleAnimation.setAttribute("to", transform.scale);
        /*
        viewer.scaleAnimation2.setAttribute("from", 10.0);
        viewer.scaleAnimation2.setAttribute("to", 1.1); */
        viewer.translateAnimation.setAttribute("from", oldtransform.X0 + "," + oldtransform.Y0); 
        viewer.translateAnimation.setAttribute("to", transform.X0 + "," + transform.Y0); 

        viewer.clipRectElement.setAttribute("x", bbox.x);
        viewer.clipRectElement.setAttribute("y", bbox.y);
        viewer.clipRectElement.setAttribute("width", bbox.width);
        viewer.clipRectElement.setAttribute("height", bbox.height); 

        viewer.disableClipPath();

        this.timeoutID = window.setTimeout(
            function (viewer) {
                viewer.enableClipPath();
            }, 1100, viewer
        );

        viewer.translateAnimation.beginElement();
        viewer.scaleAnimation.beginElement();

        /*
        viewer.clipRectElement.setAttribute("x", 0);
        viewer.clipRectElement.setAttribute("y", 0);
        viewer.clipRectElement.setAttribute("width", "100%");
        viewer.clipRectElement.setAttribute("height", "100%"); */
        viewer.currentSlide = slideid;
        viewer.labelElement.innerHTML = (viewer.currentSlide + 1) + "/" + viewer.slides.length;
    };

    function viewSlideQuick(viewer, slideid) {
        var slide = viewer.slides[slideid];
        var bbox = viewer.getSlideBBox(slide, viewer.viewportElement);
        var transform = viewer.getSlideTransform(slide);

        viewer.contentElement.setAttribute("transform",
                "translate(" + transform.X + "," + transform.Y + ")" + 
                "");

        viewer.scaleElement.setAttribute("transform", "scale(" + transform.scale + ")");
        viewer.viewportElement.setAttribute("transform", "translate(" + transform.X0 + "," + transform.Y0 + ")"); 

        viewer.clipRectElement.setAttribute("x", bbox.x);
        viewer.clipRectElement.setAttribute("y", bbox.y);
        viewer.clipRectElement.setAttribute("width", bbox.width);
        viewer.clipRectElement.setAttribute("height", bbox.height); 

        viewer.enableClipPath();

        viewer.currentSlide = slideid;
    };

    function sortSlidesByPosition(viewer, slides, direction, hiddenSlidesFill) {
        var arr = [];
        var i;
        var n;
        for(i = 0, n; n = slides[i]; ++i) {
            try {
                /* If the object has no BBox then skip it.*/
                viewer.getSlideBBox(n);
            } catch (e) {
                continue;
            }
            console.log(n.style.fill, hiddenSlidesFill);
            if (n.style.fill == hiddenSlidesFill) {
                continue;
            }
            n.style.visibility = "hidden";
            arr.push(n);
        }
        arr.sort(function (a, b) {
            a1 = viewer.getSlideBBox(a);
            b1 = viewer.getSlideBBox(b);
            ytol = a1.height * 0.2;
            xtol = a1.width * 0.2;
            switch (direction) {
                /* notice the comparison is reversed*/
                case 'lr-tb': 
                    if (a1.y > b1.y + ytol) return 1;
                    if (a1.y < b1.y - ytol) return -1;
                    if (a1.x < b1.x - xtol) return -1;
                    if (a1.x > b1.x + xtol) return 1;
                    return 0;
                default:
                case 'tb-lr':
                    if (a1.x < b1.x - xtol) return -1;
                    if (a1.x > b1.x + xtol) return 1;
                    if (a1.y > b1.y + ytol) return 1;
                    if (a1.y < b1.y - ytol) return -1;
                    return 0;
            }
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
            var length = tmppath.getTotalLength();
            nodes.push(path.getPointAtLength(length));
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

    window.addEventListener("hashchange", function() {
        if (window.location.hash) {
            viewer.jumpTo(parseInt(window.location.hash.substr(1))-1);
        }
    }, false);

    document.addEventListener("keydown", function(event) {
    //    console.log(event);
        var keyCode = event.charCode || event.keyCode;
        if (viewer.processInput(keyCode))
            event.preventDefault();
    }, false);

    window.inkslides = viewer;

    /* Note that PhantomJS < 2.0 do not support Event() constructor; 
     * see,  https://github.com/ariya/phantomjs/issues/11289 */
    var event = document.createEvent("CustomEvent");
    event.initCustomEvent("inkslides-ready", false, false, null);

    window.dispatchEvent(event);
}, false);

