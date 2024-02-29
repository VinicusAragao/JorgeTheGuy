import {Vector2D} from './geometry.js'

class BasicEffect{
	constructor(framesDuration){
		this.tileset = null
		this.tileValue = 0
		this.sor = new Vector2D
		this.radian = 0

		this.des = new Vector2D

		this.opacity = 1
		this.active = false

		this.animationDuration = game.targetFrameRate * framesDuration
		this.animationTimer = this.animationDuration
		this.frameCount = 0
	}
	deactivate(){
		this.active = false
		this.frameCount = 0
	}
	animate(){
		if(!this.active) return
		if(this.animationTimer <= 0){
			this.animationTimer = this.animationDuration
			this.frameCount++
			this.animation()
		}
		this.animationTimer -= game.deltaTime
	}
	updateTilesetPosition(newValue){
		this.tileValue = newValue
		this.sor.set(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
	}
	draw(){
		canvas.drawImage(this)
	}
	animation(){
		this.tileValue++
		if(this.tileValue >= this.tileset.tilecount) this.deactivate()
		else{
			this.updateTilesetPosition(this.tileValue)
			this.animationTimer = this.animationDuration
		}
	}
}

export class DamageNumber extends BasicEffect{
	constructor(){
		super(0.1)
		this.value = ''
		this.fill = '#fff'
		this.stroke = '#000'
		this.strokeWidth = 0.5
		this.font = '22px serif'
		this.textAlign = 'center'

		this.activate(...arguments)
	}
	activate(value,tile){
		this.des.set(Vector2D.div(tile.size,2).add(tile.des))
		this.value = value
		this.active = true
	}
	animation(){
		this.des.add(0,-1)
		this.font = `${22 - this.frameCount}px serif`
		if(this.frameCount >= 10) this.deactivate()
	}
	draw(){
		canvas.drawText(this)
	}
}
export class TargetMark extends BasicEffect{
	constructor(){
		super(0.1)
		this.tileset = loader.images.targetMark
		this.image = this.tileset.image

		this.sor = new Vector2D
		this.size = new Vector2D

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
		super(0.1)
		this.tileset = loader.images.clashBreak
		this.image = this.tileset.image

		this.sor = new Vector2D
		this.size = new Vector2D

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
		super(0.1)
		this.tileset = loader.images.clashBlock
		this.image = this.tileset.image

		this.sor = new Vector2D
		this.size = new Vector2D
		this.activate(...arguments)
	}
	activate(tile1,tile2){
		this.active = true
		this.des.set(Vector2D.sub(tile2.des,tile1.des).div(2).add(tile1.des))
		this.size.set(this.tileset.tilewidth,this.tileset.tileheight)

		this.updateTilesetPosition(0)
	}
}