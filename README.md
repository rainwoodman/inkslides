inkslides
=========

Making Slides with Inkscape

To install, copy all files in extensions directory to
~/.config/inkscape/extensions

Tutorial: see inkslides.svg

A lot of inspiration is from Sozi (sozi.baierouge.fr) and jessyInk. 

Like Sozi, inkslides switch between slide pages (view regions)
via SVG transformations. 

Differences from Sozi:
 
 * In inkslides, the order slide pages are played is defined 
   via a path.
   In Sozi this has to be defined with a model dialog and associating
   object Ids to the slides is a bit confusing.

 * In inkslides, a slide pages is treated as a whole. There is no way to
   move different layers. Sozi is in principle an animation engine, and supports
   many animations.

