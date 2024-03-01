export class AudioPlayer extends AudioContext{
	constructor(buffers){
		super()
		this.buffers = buffers
	}
	playAudio(config){
		if(config.gain === 0) return
		if(this.buffers[config.file]){
			const source = this.createBufferSource()
			source.buffer = this.buffers[config.file]

			const gainNode = new GainNode(this)
			gainNode.gain.value = config.gain ? String(config.gain) : 1

			const panNode = new StereoPannerNode(this)
			panNode.pan.value = config.pan ? String(config.pan) : 0

			source.connect(gainNode).connect(panNode).connect(this.destination)
 
			source.start(this.currentTime + config.delay)
		}
	}
}