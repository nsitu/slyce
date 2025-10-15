<template>
    <!-- Header -->
    <div class="flex gap-5 items-center justify-center p-4">
        <p class="text-sm">This demo animates artistic
            <a
                target="_blank"
                href="https://en.wikipedia.org/wiki/Slit-scan_photography"
            >
                cross sections of a video
            </a> using
            <a
                target="_blank"
                href="https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API"
            >
                WebCodecs</a>,
            <a
                target="_blank"
                href="https://github.com/Vanilagy/mediabunny"
            >
                mediabunny</a>, and
            <a
                target="_blank"
                href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API"
            >
                Canvas</a>. Multiple cross sections are made from the video. Each cross section samples one row of
            pixels
            from each frame at
            a given location. Cross sections are animated into a new video which amounts to a strategic swap of the time
            and
            space dimensions. The strategic bit allows for a loopable back-and-forth sway.
        </p>
    </div>
</template>