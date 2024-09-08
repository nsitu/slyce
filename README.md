# Testing Web Codecs
This demo creates an artistic cross section of a video using WebCodecs, WebDemuxer, and Canvas. One row of pixels is sampled from each frame. Canvas dimensions are set based on frame count. Live Demo: [https://web-codecs-test.haroldsikkema.com/](https://web-codecs-test.haroldsikkema.com/)

# Development
The project uses Vite as a build tool. During development, use `npm run dev` to launch the Vite server. 

# Deployment
This project includes a GitHub action that deploys the built frontend via CapRover. 

# TODO
- Build Display for Video Metadata acquired via web-demuxer.
- Test the accuracy of framecount supplied by web-demuxer. For linear sampling patterns the exact framecount is less important, but Sine wave sampling is going to require more accuracy. Account for framecount discrepancies, perhaps via a test run.

-


