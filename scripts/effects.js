import {Vector2D} from './geometry.js'
import {DrawableObject} from './canvas.js'

class BasicEffect extends DrawableObject{
	constructor(tileset,cell,area){
		super(tileset,cell,area)

		this.animation.timesToReplay = 0
		this.active = false
	}
	deactivate(){
		this.active = false
	}
	playAnimation(){
		if(this.active){
			if(!this.animate()){
				this.deactivate()
			}
		}
	}
	draw(){
		canvas.drawImage(this)
	}
}

export class DamageNumber{
	constructor(){
		this.des = new Vector2D
		this.value = ''
		this.fill = '#fff'
		this.stroke = '#000'
		this.strokeWidth = 0.5
		this.font = '22px serif'
		this.textAlign = 'center'

		this.frameCount = 0
		this.frameDuration = 50
		this.currentFrameDuration = 0


		this.activate(...arguments)
	}
	deactivate(){
		this.frameCount = 0
		this.active = false
		this.currentFrameDuration = 0
	}
	activate(value,tile){
		this.des.set(Vector2D.div(tile.size,2).add(tile.des))
		this.value = value
		this.active = true
	}
	playAnimation(){
		if(this.active){
			this.currentFrameDuration += game.targetFrameRate * game.deltaTime
			if(this.currentFrameDuration >= this.frameDuration){
				this.animate()
				this.currentFrameDuration = 0
			}
		}
	}
	animate(){
		this.des.add(0,-2)
		this.font = `${30 - this.frameCount*2}px serif`
		if(this.frameCount >= 10) this.deactivate()
		this.frameCount++
	}
	draw(){
		canvas.drawText(this)
	}
}
export class TargetMark extends BasicEffect{
	constructor(){
		super(loader.images.targetMark)

		this.activate(...arguments)
	}
	activate(tile){
		this.active = true
		
		this.des.set(tile.des)
		this.size.set(this.tileset.tilewidth,this.tileset.tileheight)

		this.updateTilesetPosition(0)
	}
}
export class ClashBreak extends BasicEffect{
	constructor(){
		super(loader.images.clashBreak)

		this.activate(...arguments)
	}
	activate(tile1,tile2){
		this.active = true
		this.des.set(Vector2D.sub(tile2.des,tile1.des).div(2).add(tile1.des))
		this.size.set(this.tileset.tilewidth,this.tileset.tileheight)

		this.updateTilesetPosition(0)
	}
}
export class ClashBlock extends BasicEffect{
	constructor(){
		super(loader.images.clashBlock)

		this.activate(...arguments)
	}
	activate(tile1,tile2){
		this.active = true
		this.des.set(Vector2D.sub(tile2.des,tile1.des).div(2).add(tile1.des))
		this.size.set(this.tileset.tilewidth,this.tileset.tileheight)

		this.updateTilesetPosition(0)
	}
}