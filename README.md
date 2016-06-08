inkslides
=========

Making Scientific Presentations with Inkscape.

Visually craft your presentation on a giant canvas before dividing it into slides.

Dependency
----------

1. Inkscape
2. PDFLatex (e.g. TexLive)
3. pdf2svg  (http://www.cityinthesky.co.uk/opensource/pdf2svg/)

For PDF export:

4. PhantomJS
5. pdfjoin
6. pdfpages, (Latex document class)

Install
-------

Copy all files in extensions/ directory to

```
    git clone git@github.com:rainwoodman/inkslides

    cd inkslides
    cp -r extensions/* ~/.config/inkscape/extensions
```

Then import keys/default.xml in keys directory from Edit/Preferences/Interface/Keyboard Shortcuts/Import.

Usually, if you do not already have a file there, just copy the xml file.

```
    cp keys/default.xml ~/.config/inkscape/keys/default.xml
```

Examples
--------

See https://github.com/rainwoodman/inkslides/blob/master/inkslides-tutorial.svg .

First draw the presentation, as a giant poster. Keep the ideas flow in a consistent direction. (e.g. the type writter flow, from left to right, then start a new line from the very left.)

Next define a new layer.

Then mark the presentation slides with rectangles on the new layer.

Finally, select an rectangle on the new layer, and click Extensions - Set Inkslides Control Layer. Pick the direction of the flow you decided at the beginning.

Open the file in a browser and it will play. Use space for next slide. Arrow keys work too. Tweak the document as needed.

Latex Typesetting
-----------------

No science without Latex.
Press 'L' to start typing LATEX.

(A version of textext is included.)

Convert to PDF
--------------
To convert slides to a PDF, use slides2pdf.py.

Note that pdfpages style is also required on Fedora.

Differences from Sozi
---------------------

A lot of inspiration is from Sozi (sozi.baierouge.fr) and jessyInk.

Like Sozi, inkslides switch between slide pages (view regions)
via SVG transformations.

 * In inkslides, the slide pages are always played from left to right, top to bottom.
   In Sozi this has to be defined with an external program.

 * In inkslides does not provide animation. Sozi is in principle an animation engine, and supports
   many animation effects.

Common Issues:

 - extra elements in the control layer will become extra slides

 - check the flow direction of text if they look wrong.


