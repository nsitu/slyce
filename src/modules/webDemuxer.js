import { WebDemuxer } from "web-demuxer"

// Setup WebDemuxer
// NOTE: WASM files are manually copied to public/wasm-files/
// Current version: web-demuxer v3.0.2
// To update: 
// copy "node_modules/web-demuxer/dist/wasm-files/*" 
// to "public/wasm-files/" 
const demuxer = new WebDemuxer({
    wasmFilePath: `${window.location.href}wasm-files/web-demuxer.wasm`
});

export { demuxer };
