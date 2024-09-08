// status box
const fileInfo = document.getElementById('file-info')


const niceDuration = (duration) => {
    // TODO: add hours
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    if (seconds < 10) {
        return `${minutes}:0${seconds}`
    }
    else {
        return `${minutes}:${seconds}`
    }

}

const niceFrameRate = (frameRate) => {
    const [num, den] = frameRate.split('/').map(Number)
    const frameRateNum = num / den
    return frameRateNum.toFixed(2)
}
/**vp08		VP            WebM / Google
vp09		VP            WebM / Google
hvc1		HEVC          High Efficiency Video Coding / H.265
avc1		AVC           Advanced Video Coding / H.264
av01		AV            Alliance for Open Media / AOMedia Video 1 */
const niceCodec = (codec) => {
    if (codec.startsWith('avc')) {
        return 'H.264 / AVC (Advanced Video Coding)'
    }
    else if (codec.startsWith('av01')) {
        return 'AV1 / AOMedia Video 1 (Alliance for Open Media)'
    }
    else if (codec.startsWith('hvc1') || codec.startsWith('hev1')) {
        return 'H.265 / HEVC (High Efficiency Video Coding)'
    }
    else if (codec.startsWith('vp8')) {
        return 'VP8 / WebM / Google'
    }
    else if (codec.startsWith('vp9')) {
        return 'VP9 / WebM / Google'
    }
    else {
        return codec
    }
}
/** 
 * avg_frame
 * */
let skip = ['tags']

const showFileInfo = (data) => {

    // avg_frame_rate and r_frame_rate both express frame rate
    // they use fractions to avoid floating point errors.
    // r_frame_rate is nominal e.g 30/1
    // avg_frame_rate is more precise e.g 226875000/7551029

    fileInfo.style.display = 'block'
    fileInfo.innerHTML =
        ` 
        <div class="flex items-start gap-2">
        <table> 
        <tr>
            <td class="file-info-label">File Name <span class="material-symbols-outlined">
video_file
</span></td>
            <td class="file-info-value">${data.name}</td>
        </tr> 
         <tr>
            <td class="file-info-label">Resolution <span class="material-symbols-outlined">
view_compact
</span></td>
            <td class="file-info-value">${data.width} x ${data.height} pixels (w x h)</td>
        </tr> 
        <tr>
            <td class="file-info-label">Codec <span class="material-symbols-outlined">
frame_source
</span></td>
            <td class="file-info-value">${niceCodec(data.codec_string)}</td>
        </tr>
        <tr>
            <td class="file-info-label">Codec String <span class="material-symbols-outlined">
barcode
</span></td>
            <td class="file-info-value">${data.codec_string}</td>
        </tr>
        </table>
        <table>
         
        <tr>
            <td class="file-info-label">Duration <span class="material-symbols-outlined">
timer
</span></td>
            <td class="file-info-value">${niceDuration(data.duration)}</td>
        </tr>
        <tr>
            <td class="file-info-label">Frame Rate <span class="material-symbols-outlined">
speed
</span></td>
            <td class="file-info-value">${niceFrameRate(data.r_frame_rate)}</td>
        </tr>
        <tr>
            <td class="file-info-label">Frame Count <span class="material-symbols-outlined">
calculate
</span></td>
            <td class="file-info-value">${data.nb_frames}</td>
        </tr>
       
      
        <tr>
            <td class="file-info-label">Rotation <span class="material-symbols-outlined">
rotate_right
</span></td>
            <td class="file-info-value">${data.rotation} degrees</td>
        </tr>
        </table>
        </div>
        `

}

export { showFileInfo };
