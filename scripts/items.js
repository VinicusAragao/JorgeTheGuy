import {Vector2D} from './geometry.js'

class BaseItem{
	constructor(tileset,x,y,area){
		this.tileset = tileset
		this.image = tileset.image
		this.tileValue = 0
		this.area = area ? area : game.currentArea

		this.cell = new Vector2D(x,y)
		this.size = new Vector2D(this.tileset.tilewidth,this.tileset.tileheight)
		this.tile = this.area.getTile(this.cell)
		this.des = Vector2D.add(this.tile.des,
			new Vector2D(
				(this.tile.size.x - this.size.x)/2,
				(this.tile.size.y - this.size.y)/2
			)
		)
		this.sor = new Vector2D(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
		this.inventory = {
			cell: new Vector2D,
			cellSize: new Vector2D(0,0)
		}

		this.hovered = false
		this.tile.items.push(this)
	}
	getPicked(){
		this.tile.items.findAndRemove(this)
		this.tile = null
	}
}
export class Potato extends BaseItem{
	constructor(x,y,area){
		super(loader.images.potato,x,y,area)
	}
}