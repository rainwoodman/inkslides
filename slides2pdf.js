/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var page = require("webpage").create(),
    url, tmpDir;

/*
 * Custom implementation of console.log().
 * Called from sandboxed Javascript.
 */
page.onConsoleMessage = function (msg) {
    console.log("slides2pdf.js> " + msg);
};

/*
 * Render the current page into a PDF file.
 * Called from sandboxed Javascript.
 */
page.onCallback = function (fileName) {
    page.zoomFactor = 0.5;
    page.render(tmpDir + fileName + ".pdf");
};

/*
 * Sandboxed function
 */
function main(options) {

    function markInterval(list, first, last, step, value) {
        if (step > 0) {
            for (var i = first; i <= last; i += step) {
                if (i >= 0 && i < list.length) {
                    list[i] = value;
                }
            }
        }
    }

    /*
     * Parse an expression and mark the corresponding frames with the given value.
     *
     * expr ::= interval ("," interval)*
     *
     * interval ::=
     *      INT                     // frame number
     *    | INT? ":" INT?           // first:last
     *    | INT? ":" INT? ":" INT?  // first:second:last
     *
     * If first is omitted, it is set to 1.
     * If second is omitted, it is set to first + 1.
     * If last is omitted, it is set to list.length.
     */
    function markFrames(list, expr, value) {
        switch (expr) {
            case "all":
                markInterval(list, 0, list.length - 1, 1, value);
                break;
            case "none":
                break;
            default:
                var intervalList = expr.split(",");
                for (var i = 0; i < intervalList.length; i ++) {
                    var interval = intervalList[i].split(":").map(function (s) { return s.trim(); });
                    if (interval.length > 0) {
                        var first = interval[0] !== "" ? parseInt(interval[0]) - 1 : 0;
                        var last = interval[interval.length - 1] !== "" ? parseInt(interval[interval.length - 1]) - 1 : list.length - 1;
                        var second = interval.length > 2 && interval[1] !== "" ? parseInt(interval[1]) - 1 : first + 1;
                        if (!isNaN(first) && !isNaN(second) && !isNaN(last)) {
                            markInterval(list, first, last, second - first, value);
                        }
                    }
                }
        }
    }

    function zeroPadded(value, digits) {
        var result = value.toString();
        while(result.length < digits) {
            result = "0" + result;
        }
        return result;
    }

    function renderFrames() {
        var frameCount = window.inkslides.slides.length;

        var digits = frameCount.toString().length;

        for (var i = 0; i < frameCount; i ++) {
            console.log("Exporting frame: " + (i + 1));
            window.inkslides.jumpToQuick(i);
            window.callPhantom(zeroPadded((i + 1).toString(), digits));
        }
    }

    window.addEventListener("load", function () {
        window.addEventListener("inkslides-ready", renderFrames);
    }, false);
}

if (phantom.args.length < 4) {
    console.log("Usage: slides2pdf.js url.svg dir width_px height_px");
    phantom.exit();
}
else {
    page.paperSize = {
        width:  phantom.args[2] + "px",
        height: phantom.args[3] + "px"
    };
    page.viewportSize = {
        width:  parseFloat(phantom.args[2]),
        height: parseFloat(phantom.args[3])
    };

    page.onInitialized = function () {
        page.evaluate(function (main, options) {
            main(options);
        }, main, {});
    };
    
    url = phantom.args[0];    
    tmpDir = phantom.args[1] + "/";
    
    page.open(url, function (status) {
        if (status !== "success") {
            console.log("slides2pdf.js> Unable to load the document: " + url);
        }
        phantom.exit();
    });
}

