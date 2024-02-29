import {Vector2D,getDistance} from './geometry.js'
import * as Effects from './effects.js'

export class Area{
	constructor(areaFile){
		Object.assign(this,areaFile)

		this.timerDuration = game.targetFrameRate
		this.timer = this.timerDuration

		this.entities = []
		this.projectiles = []
		this.effects = {}
		this.movementRequests = []

		this.size = new Vector2D(this.layers[0].width,this.layers[0].height)
		this.layers.forEach(layer => {
			layer.allTiles = []
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
					layer.allTiles.push(layer.tiles[y][x])
				}
			}
		})

		this.tilesCollisionMap = []
		this.collisionMap = []

		for(let y = 0; y < this.size.y;y++){
			this.tilesCollisionMap[y] = []
			this.collisionMap[y] = []
			for(let x = 0; x < this.size.x;x++){
				this.tilesCollisionMap[y][x] = true
				this.collisionMap[y][x] = true

				this.layers.forEach(layer => {
					const tile = layer.tiles[y][x]	
					if(tile && tile.blocked){
						this.tilesCollisionMap[y][x] = false
						this.collisionMap[y][x] = false
					}
				})
			}
		}
	}
	getPath(startingEntity,endingCell){
		const path = pathfinder.getPath(
			startingEntity.cell,
			endingCell,
			this.collisionMap,
			startingEntity.weapon.type === 'ranged',
			startingEntity.walksDiagonally
		)		
		return path
	}
	generateEffect(className){
		const group = this.effects[className]
		const argumentsToPass = [...arguments]
		argumentsToPass.shift()

		let newEffect
		if(group){
			for(const effect of group){
				if(!effect.active){
					effect.activate(...argumentsToPass)
					return effect
				}
			}
			newEffect = new Effects[className](...argumentsToPass)
			group.push(newEffect)
		}
		else{
			newEffect = new Effects[className](...argumentsToPass)
			this.effects[className] = [newEffect]
		}
		return newEffect
	}
	manageTurns(){
		if(this === game.currentArea){
			if(this.timer > 0){
				this.timer -= game.deltaTime
				return false
			}
			else if(this.entities.length === 0) this.timer = this.timerDuration
		}

		for(let i = 0; i < this.entities.length;i++){
			const entity = this.entities[i]
			if(entity.constructor.name === 'Player' || (!game.player.alive && i === 0)){
				if(entity.move()){
					this.timer = this.timerDuration
				}
				else return false
			}
			else entity.move()
		}
		this.entities.forEach(entity => {
			this.processMovement(entity)
		})
		this.entities.forEach(entity => {
			entity.reduceCooldown()
			const result = this.processAttacks(entity)

			if(result.hit && entity.weapon.attackSFX) this.playAreaAudio(entity.weapon.attackSFX)
			else if(result.missed) this.playAreaAudio('miss')
			if(result.blocked) this.playAreaAudio('clash')

			if(entity.deliveredAttacks.length > 0){
				entity.updateTilesetPosition(entity.tilesetValues.attack)
				entity.cooldown += entity.weapon.cooldown	

				const distanceModifier = this === game.currentArea ? 1 : 0.5
				canvas.setScreenShake(Math.max(2 * result.totalDamage,2) * distanceModifier)
			}
		})

		this.entities.forEach(entity => entity.deliveredAttacks = [])

		this.projectiles.forEach(projectile => {
			if(projectile.alive) projectile.checkHit()
		})

		this.layers[0].allTiles.forEach(tile => tile.itemsInteractions())
		return true
	}
	processMovement(entity){
		if(entity.movementRequest){
			const request = entity.movementRequest

			request.entity.cell.set(request.newCell)
			request.oldTile.entity = null

			request.entity.tile = request.newTile
			request.newTile.entity = request.entity
			
			if(!request.newArea){
				if(request.entity.occupiesTiles) this.updateCollisionMap(request.newCell,request.oldCell)
			}
			else{
				if(request.entity.occupiesTiles){ 
					request.entity.area.updateCollisionMap(null,request.oldCell)
					request.newArea.updateCollisionMap(request.newCell,null)
				}

				request.entity.des.set(request.newTile.des)
				request.entity.updateBars()	

				this.entities.findAndRemove(request.entity)
				request.entity.area = request.newArea
				request.newArea.entities.unshift(request.entity)
				
				request.entity.dripLiquid()
			}

			request.entity.updateTilesetPosition(request.entity.tilesetValues.walking)
			
			entity.movementRequest = null
		}

	}
	processAttacks(entity){
		const result = {
			hit: 0,
			missed: 0,
			blocked: 0,
			totalDamage: 0
		}
		entity.deliveredAttacks.forEach(attack => {
			if(attack.blocked) return

			const tile = attack.targetTile
			const hitEntity = tile.entity

			let damageInduced = 0
			if(hitEntity){
				const clash = this.checkClash(attack,hitEntity)

				if(clash){
					result.blocked++
					if(clash.strengthDifference !== 0){
						damageInduced = clash.loser.calculateDamage(clash.winner)
						clash.loser.cooldown += Math.abs(clash.strengthDifference)
						this.generateEffect('ClashBreak', clash.winner.tile, clash.loser.tile)
						this.generateEffect('DamageNumber', damageInduced, clash.loser.tile)
					}
					else{
						this.generateEffect('ClashBlock', entity.tile, hitEntity.tile)
					}
					clash.secondAttack.blocked = true
				}
				else{
					result.hit++
					damageInduced = hitEntity.calculateDamage(entity)
					this.generateEffect('DamageNumber', damageInduced, hitEntity.tile)
					this.generateEffect('TargetMark', hitEntity.tile)
				}
			}
			else{
				result.missed++
				this.generateEffect('TargetMark', tile)
			}

			result.totalDamage += damageInduced
		})
		return result
	}
	checkClash(firstAttack,secondEntity){
		const firstEntity = firstAttack.attacker
		for(let i = 0; i < secondEntity.deliveredAttacks.length;i++){
			const secondAttack = secondEntity.deliveredAttacks[i]
			if(secondAttack.blocked) continue

			if(secondAttack.targetTile.entity === firstEntity){
				const strengthDifference = firstEntity.weapon.strength - secondEntity.weapon.strength

				return {
					strengthDifference: strengthDifference,
					winner: strengthDifference > 0 ? firstEntity : strengthDifference < 0 ? secondEntity : null,
					loser: strengthDifference > 0 ? secondEntity : strengthDifference < 0 ? firstEntity : null,
					secondAttack: secondAttack,
 				}
			}
		}
		return false
	}
	drawFirstLayer(){
		this.layers[0].allTiles.forEach(tile => {
			canvas.drawImage(tile)
			tile.items.forEach(item => canvas.drawImage(item))
		})
	}
	drawOtherLayers(){
		this.layers.forEach((layer,layerIndex) => {
			if(layerIndex === 0) return

			layer.allTiles.forEach(tile => {
				if(this.layers[0].tiles[tile.cell.y][tile.cell.x].entity){
					tile.opacity = 0.75
				}
				else tile.opacity = 1
				canvas.drawImage(tile)
			})
		})
	}
	getTile(cell){
		let x = cell.x < 0 ? 0 : cell.x
		let y = cell.y < 0 ? 0 : cell.y

		if(x >= this.size.x) x = this.size.x - 1
		if(y >= this.size.y) y = this.size.y - 1

		return this.layers[0].tiles[y][x]
	}
	getTilesBetween(start,end){
		const currentCell = new Vector2D(start)
		const distance = Vector2D.sub(end,start)
		const direction = Vector2D.limitTo(distance,1)
		const tiles = []

		while(true){
			currentCell.x += currentCell.x !== end.x ? direction.x : 0
			currentCell.y += currentCell.y !== end.y ? direction.y : 0
			
			if(currentCell.x === end.x && currentCell.y === end.y) 
				break
			if(this.isValidCell(currentCell)) 
				tiles.push(this.getTile(currentCell))
			else break
		} 
		return {
			tiles: tiles,	
			direction: direction,
			distance: distance	
		}	
	}
	updateCollisionMap(newBlocker,oldBlocker){
		if(newBlocker) this.collisionMap[newBlocker.y][newBlocker.x] = false
		if(oldBlocker && this.tilesCollisionMap[oldBlocker.y][oldBlocker.x])
			this.collisionMap[oldBlocker.y][oldBlocker.x] = true
	}
	isFreeCell(cell){
		return this.collisionMap[cell.y][cell.x]
	}
	isValidCell(cell){
		return cell.x >= 0 && cell.x < this.size.x && cell.y >= 0 && cell.y < this.size.y 
	}
	playAreaAudio(fileName){
		const directionX = Math.abs(this.x) - Math.abs(game.currentArea.x)
		const distance = getDistance(
			new Vector2D(this.x,this.y),
			new Vector2D(game.currentArea.x,game.currentArea.y)
		)
		
		audioPlayer.playAudio({
			file: fileName,
			gain: distance > 5 ? 0 : 1 / (distance + 1),
			pan: directionX >= 1 ? 0.75 : directionX <= -1 ? -0.75 : 0,
			delay: distance * 0.25,
		})
	}
}

class Tile{
	constructor(cell,tileset,value){
		this.cell = cell
		this.tileset = tileset
		this.value = value
		this.stroke = '#333'
		this.strokeWidth = 0.5

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
	itemsInteractions(){
		this.items.forEach(item => {
			if(item.interactible) item.interaction()
		})
	}
}