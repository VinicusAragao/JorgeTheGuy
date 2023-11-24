import {Vector2D} from './geometry.js'

class BasicProjectile{
	constructor(area,cell,direction,tileset){
		this.cell = new Vector2D(cell)
		this.area = area
		this.direction = direction
		this.tileset = tileset
		this.image = tileset.image
		this.opacity = 1

		this.tile = this.area.getTile(this.cell)
		this.des = this.tile.des
		this.size = new Vector2D(this.tileset.tilewidth,this.tileset.tileheight)
		
		this.tileValue = 0
		this.sor = new Vector2D(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)

		this.animationDuration = game.targetFrameRate
		this.animationTimer = 0

		this.damage = 0
		this.traveledDistance = 0

		this.area.projectiles.push(this)
	}
	updateTilesetPosition(newValue){
		this.tileValue = newValue ? newValue : this.tileValue
		this.sor.set(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
	}
	death(){
		this.area.projectiles.findAndRemove(this)
	}
	checkHit(){
		if(this.tile.entity){
			this.area.getEffectObject('TargetMark',[this.area]).activate(this.cell)
			this.area.getEffectObject('DamageNumber').activate(
				this.tile.entity.calculateDamage(this.damage),
				Vector2D.add(this.tile.des,Vector2D.div(this.tile.size,2))
			)
			this.death()
		}
		this.changeCell(Vector2D.add(this.cell,this.direction))
	}
	changeCell(cell){
		if(this.area.isValidCell(cell)){
			this.tile = this.area.getTile(cell)
			this.des.set(this.tile.des)
			this.cell.set(cell)
			this.traveledDistance++	
		}
		else this.death()
	}
	animate(){
		if(this.animationTimer >= this.animationDuration){
			this.tileValue = this.tileValue + 1 < this.tileset.tilecount ? this.tileValue + 1 : 0 
			this.animationTimer = 0
			this.updateTilesetPosition()
		}
		this.animationTimer++
	}
}
export class Rock extends BasicProjectile{
	constructor(area,trajectoryData){
		super(area,
			trajectoryData.tiles[0].cell,
			trajectoryData.direction,
			loader.images.thrownRock
		)
		this.animationDuration = game.targetFrameRate * 0.25
		this.damage = 0.5
	}
}