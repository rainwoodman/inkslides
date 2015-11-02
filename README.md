inkslides
=========

Making Slides with Inkscape

To install, copy all files in extensions directory to
~/.config/inkscape/extensions

To use, see inkslides.svg

To convert slides to a PDF, use slides2pdf.py. Depends on PhantomJS
which is not so straight-forward to install, and also on pdfjoin.
Note that pdfpages style is also required on Fedora.

A lot of inspiration is from Sozi (sozi.baierouge.fr) and jessyInk. 

Like Sozi, inkslides switch between slide pages (view regions)
via SVG transformations. 

Differences from Sozi:
 
 * In inkslides, the slide pages are always played from left to right, top to bottom.
   In Sozi this has to be defined with an external program.

 * In inkslides does not provide animation. Sozi is in principle an animation engine, and supports
   many animation effects.

Common Issues:

 - extra elements in the control layer will become extra slides

 - check the flow direction of text if they look wrong.


