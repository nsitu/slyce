# Slyce
This demo creates animated cross sections from a video. It uses [mediabunny](https://github.com/Vanilagy/mediabunny) to handle WebCodecs decoding. From each frame, we sample rows or columns of pixels depending on the settings. Canvas dimensions are set based on frame count and are also adjustable via settings.

## Points of view
When the camera is vertical and panning horizontally (e.g. out of a car window), sample rows and write rows, you'll get a nice sway out of it.

## Development
The project uses Vite as a build tool. During development, use `npm run dev` to launch the Vite server. This project includes a GitHub action that builds the frontend and deploys it to GitHub Pages. 

## TODO
Explore other ideal combinations for various points of view (e.g. horizontal orientation, camera stationary, moving forward towards the horizon, etc.)

Explore whether we could sample rows of pixels in a way that takes into account pixels in nearby frames. If we represent raw RGBA data as a kind of 3D space via a multidimensional array, we might be able to calculate the properties of theoretical points that exist somewhere within that space. These points might be derivable from the surrounding pixels in a way that should give us a more flexible and fluid result. 

## Related 
A related tool here is the python library numpy. Elsewhere I have explored using a numpy multidimensional array to, for example swap the time and space axes in a video. See also [https://numpy.org/doc/stable/reference/generated/numpy.swapaxes.html#numpy.swapaxes](https://numpy.org/doc/stable/reference/generated/numpy.swapaxes.html#numpy.swapaxes). In JavaScript land, *scijs* supports n-dimensional arrays as well, but I don't know if this is the right avenue. See also [https://scijs.net/packages/#scijs/ndarray](https://scijs.net/packages/#scijs/ndarray)


