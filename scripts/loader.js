import {Vector2D} from './geometry.js'

export class Loader{
	constructor(){
		this.images = {}
		this.audio = {}
		this.world = []
		this.audioContext = new AudioContext()
	}
	loadAudio(audioSrc){
		return Promise.all(audioSrc.map(filePath => {
			const request = new XMLHttpRequest
			request.open('GET','./audio/' + filePath)
			request.responseType = 'arraybuffer'

			request.onload = () => {
				this.audioContext.decodeAudioData(request.response).then(buffer => {
					const fileName = filePath.slice(0,filePath.length-4)
					this.audio[fileName] = buffer
				})
			}
			request.send()
		}))
	}
	loadExtraImages(imagesSrc){
		return Promise.all(imagesSrc.map(src => new Promise(resolve => {
			if(this.images[src]){
				resolve()
			}
			this.loadXML(src).then(doc => {
				this.getImageFromXML(doc).then(result => {
					this.images[result.imageName] = result
					resolve(result)
				})
			})
		})
	))}
	getImageFromXML(doc){		
		return new Promise(resolve => {
			const layer = {}
			const tileset = doc.querySelector('tileset').attributes 
			const collisionObjects = doc.querySelector('objectgroup')

			if(collisionObjects){
				layer.collision = [] 
				collisionObjects.querySelectorAll('object').forEach(obj => {
					const hitbox = {
						x: Number(obj.attributes.x.value),
						y: Number(obj.attributes.y.value)
					}

					if(obj.querySelector('ellipse')){
						hitbox.r = Math.min(
							Number(obj.attributes.width.value),
							Number(obj.attributes.height.value)
						) / 2
						hitbox.x += hitbox.r
						hitbox.y += hitbox.r
						hitbox.format = 'circle'
					}
					else{
						hitbox.w = Number(obj.attributes.width.value)
						hitbox.h = Number(obj.attributes.height.value)
						hitbox.format = 'rect'
					}
					layer.collision.push(hitbox)
				})
			}
			this.loadImage(doc.querySelector('image').attributes.source.value).then(img => { 
				layer.image = img
				layer.imageName = tileset.name.value
				layer.columns = Number(tileset.columns.value)
				layer.tilecount = Number(tileset.tilecount.value)
				layer.tilewidth = Number(tileset.tilewidth.value)
				layer.tileheight = Number(tileset.tileheight.value)

				resolve(layer)
			})	
		})
	}
	loadWorld(imagesSrc,audioSrc){
		this.images = {}

		return new Promise(resolve => {
			this.getJsonFile('coisa.world') 
			.then(world => {
				this.world = world
				const promises = this.world.maps.map(map => this.getArea(map.fileName,map))
				promises.push(this.loadExtraImages(imagesSrc))
				promises.push(this.loadAudio(audioSrc))
				
				Promise.all(promises).then(result => {
					const mapSize = {
						left: Infinity,
						up: Infinity,
						down: -Infinity,
						right: -Infinity,
						totalSize: new Vector2D,
					}
					for(let i = 0; i < result.length-1;i++){
						const area = result[i]
						const x = area.x / area.width
						const y = area.y / area.height
						area.x = x
						area.y = y
						
						mapSize.left = x < mapSize.left ? x : mapSize.left
						mapSize.up = y < mapSize.up ? y : mapSize.up
						mapSize.down = y > mapSize.down ? y : mapSize.down
						mapSize.right = x > mapSize.right ? x : mapSize.right
					}
					mapSize.totalSize.set(
						Math.abs(mapSize.left) + Math.abs(mapSize.right) + 1,
						Math.abs(mapSize.up) + Math.abs(mapSize.down) + 1
					)
					this.world.areas = []
					for(let y = 0; y < mapSize.totalSize.y; y++){
						this.world.areas.push([])
						for(let x = 0; x < mapSize.totalSize.x; x++){
							this.world.areas[y][x] = null
						}
					}
					for(let i = 0; i < result.length-2;i++){
						const area = result[i]
						area.x -= mapSize.left
						area.y -= mapSize.up

						this.world.areas[area.y][area.x] = area
					}
					resolve([this.world,this.images,this.audio])
				})
			})
		})
	}
	getArea(filename,area){
		return new Promise(resolve => {
			this.getJsonFile(filename)
			.then(areaFile => {
				const promises = areaFile.tilesets.map((tileset,index) => this.createLayer(tileset,index))

				Promise.all(promises).then(tilesets => {
					areaFile.tilesets = tilesets
					Object.assign(areaFile,area)
					resolve(areaFile)
				})
			})
		})  
	}
	getJsonFile(path){
		return fetch('./tiled/' + path).then(response => response.json())
	}
	createLayer(layer,layerID){
		return new Promise(resolve => {
			this.loadXML(layer.source)
			.then(doc => {
				const tiles = doc.querySelectorAll('tile')
				for(const tile of tiles){
					const properties = {}

					for(const propertyEl of tile.querySelectorAll('property')){
						const attributes = propertyEl.attributes
						if(attributes.type.value === 'bool'){
							properties[attributes.name.value] = attributes.value.value === 'true' ? true : false
						}
					}
					layer[tile.attributes.id.value] = properties
				}
				this.getImageFromXML(doc)
				.then(result => {	
					Object.assign(layer,result)
					resolve(layer)
				})
			})
		})
	}
	loadXML(path){
		return new Promise(resolve => {
			const request = new XMLHttpRequest
			request.open("GET",'./tiled/' + path)
			request.onload = () => {
				const parser = new DOMParser
				resolve(parser.parseFromString(request.response,'text/xml'))
			}
			request.send()
		})
	}
	loadImage(src){
		return new Promise(resolve => {
			const img = new Image
			img.onload = () => resolve(img)
			img.src = src.slice(3)			
		})
	}
}