import { useAppStore } from '../stores/appStore';
import { demuxer } from './webDemuxer.js';

const getMetaData = async () => {

    const app = useAppStore()  // Pinia store 

    // reset framecount for a new file
    app.set('frameCount', 0)
    app.set('fileInfo', null)

    try {
        app.log(`Loading Demuxer`)
        app.log(`Loading Stream Info`)
        app.log(`Loading Video Decoder Config`)
        await demuxer.load(app.file);
        let info = await demuxer.getAVStream();
        let config = await demuxer.getVideoDecoderConfig();
        console.log('getAVStream', info)
        console.log('getVideoDecoderConfig', config)
        app.set('frameCount', Number(info.nb_frames))
        app.set('fileInfo', { ...info, name: app.file.name })
        app.set('config', config)

    } catch (error) {
        console.error('Failed to get file meta data:', error);
    }
}

export { getMetaData }