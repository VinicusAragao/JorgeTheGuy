export class AudioPlayer{
	constructor(files){
		this.audios = {}
		this.files = files
	}
	playAudio(audioName,config){
		if(this.audios[audioName]){
			for(let i = 0; i < this.audios[audioName].length;i++){
				const ctx = this.audios[audioName][i]
				console.log(ctx.state,this.audios[audioName].length)
				if(ctx.state === 'suspended'){
					ctx.play()
					return 
				}
			}
			this.audios[audioName].push(new AudioTrack(this.files[audioName],config))
		}
		this.audios[audioName] = [new AudioTrack(this.files[audioName],config)]
		this.audios[audioName][0].play()
		console.log(this.audios[audioName][0].state)

	}
}
export class AudioTrack extends AudioContext{
	constructor(file,config){
		super()
		this.file = file

		const track = this.createMediaElementSource(file)
		const gainNode = new GainNode(this)
		const panNode = new StereoPannerNode(this,{pan:0})
		
		gainNode.gain.value = 1
		track.connect(gainNode).connect(panNode).connect(this.destination)

		this.addEventListener('ended',() => {
			this.suspend()
		})
	}
	play(){
		this.resume().then(result => {
			this.file.play()
		})
	}
}