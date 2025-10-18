# Slyce
This demo creates animated cross sections from a video using WebCodecs, [mediabunny](https://github.com/Vanilagy/mediabunny), and Canvas. One row of pixels is sampled from each frame. Canvas dimensions are set based on frame count and are also adjustable via settings.

# Development
The project uses Vite as a build tool. During development, use `npm run dev` to launch the Vite server. 

# Deployment
This project includes a GitHub action that builds the frontend and deploys it to GitHub Pages. 


# Points of view
When the camera is vertical and panning horizontally (e.g. out of a car window), sample rows and write rows, you'll get a nice sway out of it.

# TODO
Explore other ideal combinations for various points of view (e.g. horizontal orientation, camera stationary, moving forward towards the horizon, etc.)


