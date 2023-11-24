import {Vector2D} from './geometry.js'

class BasicEffect{
	constructor(framesDuration){
		this.tileset = null
		this.tileValue = 0
		this.sor = new Vector2D

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
		if(this.animationTimer <= 0){
			this.animationTimer = this.animationDuration
			this.frameCount++
			this.animation()
		}
		this.animationTimer--
	}
	updateTilesetPosition(newValue){
		this.tileValue = newValue
		this.sor.set(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
	}
}

export class DamageNumber extends BasicEffect{
	constructor(){
		super(0.1)
		this.des = new Vector2D() 
		this.text = null
		this.fill = '#f00'
		this.stroke = '#000'
		this.strokeWidth = 0.25
		this.font = '12px serif'
		this.textAlign = 'center'
	}
	activate(value,des){
		this.des.set(des)
		this.value = value
		this.active = true
	}
	animation(){
		this.des.add(0,-1)
		if(this.frameCount >= 10) this.deactivate()
	}
	draw(){
		canvas.renderer.drawText(this)
	}
}
export class TargetMark extends BasicEffect{
	constructor(area){
		super(0.1)

		this.tileset = loader.images.targetMark
		this.image = this.tileset.image
		this.tile = null

		this.cell = new Vector2D
		this.des = new Vector2D
		this.sor = new Vector2D
		this.size = new Vector2D
		this.area = area
	}
	animation(){
		this.tileValue++
		if(this.tileValue >= this.tileset.tilecount) this.deactivate()
		else{
			this.updateTilesetPosition(this.tileValue)
			this.animationTimer = this.animationDuration
		}
	}
	activate(cell){
		this.active = true
		
		this.cell.set(cell)
		this.tile = this.area.getTile(this.cell)
		this.des.set(this.tile.des)
		this.size.set(this.tileset.tilewidth,this.tileset.tileheight)

		this.updateTilesetPosition(0)
	}
	draw(){
		canvas.drawImage(this)
	}
}