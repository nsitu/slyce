# Testing Web Codecs
This demo creates an artistic cross section of a video using WebCodecs, WebDemuxer, and Canvas. One row of pixels is sampled from each frame. Canvas dimensions are set based on frame count.  

# Development
The project uses Vite as a build tool. During development, use `npm run dev` to launch the Vite server. 

# Deployment
This project includes a GitHub action that builds the frontend and deploys it to CapRover. 

# TODO 
- Test the accuracy of framecount supplied by web-demuxer. For linear sampling patterns the exact framecount is less important, but Sine wave sampling is going to require more accuracy. Account for framecount discrepancies, perhaps via a test run.

- Account for videos that are taller than they are wide. while most portrait videos are 1920x1080 with a rotation metadata. sometimes you do get 1080x1920 videos e.g. when processed Adobe Premiere by SVP Smooth Video Project

- Allow for manual control of rotation.

- Allow for the use of a webcam as a source

- split outputs into a series of square videos instead of a single long video.

- Account for a wide range of factors, including orientation, rotation, sampling mode (rows or columns), write mode (rows or columns), use of short side, etc.

- Test whether output should always be columns, so as to establish a standardfor threejs work later on

