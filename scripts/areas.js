import {Vector2D} from './geometry.js'
import * as Effects from './effects.js'

export class Area{
	constructor(areaFile){
		Object.assign(this,areaFile)

		this.turn = 0
		this.timerDuration = game.targetFrameRate / 2
		this.timer = this.timerDuration

		this.entities = []
		this.items = []
		this.projectiles = []
		this.effects = {}

		this.size = new Vector2D(this.layers[0].width,this.layers[0].height)
		this.layers.forEach(layer => {
			layer.tiles = new Array(this.size.y)
			for(let y = 0; y < layer.tiles.length; y++){
				layer.tiles[y] = new Array(this.size.x)
				for(let x = 0; x < layer.tiles[y].length; x++){
					const cell = new Vector2D(x,y)
					let value = layer.data[y * this.size.x + x]
					if(value === 0) continue

					let tileset = {}
					for(let i = 0; i < this.tilesets.length;i++){
						const selectedTileset = this.tilesets[i]
						if(selectedTileset.firstgid <= value
						&& selectedTileset.firstgid + selectedTileset.tilecount > value){
							tileset = selectedTileset
							break 
						}
					}
					value -= tileset.firstgid
					layer.tiles[y][x] = new Tile(cell,tileset,value)
				}
			}
		})

		this.tilesCollisionMap = new Array(this.layers[0].tiles.length)
		for(let y = 0; y < this.tilesCollisionMap.length;y++){
			this.tilesCollisionMap[y] = new Array(this.layers[0].tiles[y].length)
			for(let x = 0; x < this.tilesCollisionMap[y].length;x++){
				this.tilesCollisionMap[y][x] = true

				this.layers.forEach(layer => {
					const tile = layer.tiles[y][x]	
					if(tile && tile.blocked) this.tilesCollisionMap[y][x] = false
				})
			}
		}

		this.updateCollisionMap()
	}
	getEffectObject(className,args){
		const group = this.effects[className]
		let unactiveEffect = null

		const argumentsToPass = args ? args : []
		
		if(group){
			for(let i = 0; i < group.objects.length;i++){
				const effect = group.objects[i]
				if(!effect.active){
					unactiveEffect = effect
					break
				}
			}

			if(!unactiveEffect){
				unactiveEffect = new Effects[className](...argumentsToPass)
				group.objects.push(unactiveEffect)
			}
		}
		else{
			unactiveEffect = new Effects[className](...argumentsToPass)
			this.effects[className] = {objects: []}
			this.effects[className].objects.push(unactiveEffect)
		}
		return unactiveEffect
	}
	manageTurns(){
		this.projectiles.forEach(projectile => projectile.checkHit())
		for(let i = 0; i < this.entities.length;i++){
			let entity = this.entities[this.turn]
			if(!entity){
				this.turn = this.entities.length-1
				entity = this.entities[this.turn]
			}
			if(entity.constructor.name === 'Player'){
				if(this.timer > 0){
					this.timer--
					return false
				}

				else if(entity.move()){
					this.timer = this.timerDuration
					this.passTurn()
					this.updateCollisionMap()
				}
				else return false
			}
			else{
				entity.move()
				this.passTurn()
				this.updateCollisionMap()
			}
		}

		return true
	}
	passTurn(){
		this.turn++
		if(this.turn >= this.entities.length){
			this.turn = 0
		}
	}
	drawTiles(){
		this.layers.forEach(layer => {
			layer.tiles.forEach(column => {
				column.forEach(tile => canvas.drawImage(tile))
			})
		})
		this.layers[0].tiles.forEach(column => 
			column.forEach(tile =>
				tile.items.forEach(item => canvas.drawImage(item))
			)
		)
	}
	getTile(cell){
		return this.layers[0].tiles[cell.y][cell.x]
	}
	getTilesBetween(start,end){
		const currentCell = new Vector2D(start)
		const distance = Vector2D.sub(end,start)
		const direction = new Vector2D(
			distance.x > 0 ? 1 : distance.x < 0 ? -1 : 0,
			distance.y > 0 ? 1 : distance.y < 0 ? -1 : 0
		)
		const tiles = []

		while(true){
			currentCell.x += currentCell.x !== end.x ? direction.x : 0
			currentCell.y += currentCell.y !== end.y ? direction.y : 0
			
			if(currentCell.x === end.x && currentCell.y === end.y){
				return {
					tiles: tiles,	
					direction: direction,
					distance: distance	
				}
			}
			tiles.push(this.getTile(currentCell))
		} 
	}
	updateCollisionMap(){
		this.collisionMap = new Array(this.tilesCollisionMap.length)
		this.tilesCollisionMap.forEach((column,index) => {
			this.collisionMap[index] = []
			Object.assign(this.collisionMap[index],column)
		})
		this.entities.forEach(entity => {
			this.collisionMap[entity.cell.y][entity.cell.x] = false
		})
	}
	isOccupied(cell){
		return this.collisionMap[cell.y][cell.x]
	}
	isValidCell(cell){
		return cell.x >= 0 && cell.x < this.size.x && cell.y >= 0 && cell.y < this.size.y 
	}
	activateTargetMark(cell){
		this.targetMarks.forEach(mark => {
			if(!mark.active){
				mark.setCell(cell)
				return 
			}
		})
	}
}

class Tile{
	constructor(cell,tileset,value){
		this.cell = cell
		this.tileset = tileset
		this.value = value
		this.stroke = '#333'
		this.strokeWidth = 0.05

		this.image = tileset.image
		this.size = new Vector2D(tileset.tilewidth,tileset.tileheight)
		this.des = Vector2D.mult(cell,this.size)
		this.sor = new Vector2D(
			this.size.x * (value % tileset.columns),
			this.size.y * Math.floor(value / tileset.columns)
		)
		this.opacity = 1
		this.entity = null
		this.items = []

		Object.assign(this,tileset[this.value])
	}
}