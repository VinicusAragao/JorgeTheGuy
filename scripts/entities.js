import {Vector2D,getManhatthanDistance,randomInt} from './geometry.js'

class BasicEntity{
	constructor(cell,tileset){
		this.cell = new Vector2D(cell)
		this.tileset = tileset
		this.image = this.tileset.image

		this.tile = canvas.getTile(this.cell)
		this.des = this.tile.des
		this.size = new Vector2D(this.tileset.tilewidth,this.tileset.tileheight)
		
		this.tileValue = 0
		this.sor = new Vector2D(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)

		this.faction = 'none'
		this.alive = true
		this.lifePoints = 0
		this.damagePoints = 0
		this.defensePoints = 0

		this.attackCooldown = 0
		this.attackCooldownDuration = 0

		this.interactingWith = null
		this.interactionCount = 0
		this.messageCount = 0

		this.equipment = {}
		this.inventory = {}

		this.updateTile(cell)
		game.entities.push(this)
	}
	death(){
		this.alive = false
		this.tile.entity = null
		game.entities.findAndRemove(this)
	}
	deliverAttack(cell){
		game.activateTargetMark(cell)
		const entity = canvas.getTile(cell).entity
		if(entity){
			entity.calculateDamage(this.damagePoints)
		}
		this.attackCooldown = this.attackCooldownDuration
	}
	calculateDamage(damage){
		const totalDamage = Math.max(damage - this.defensePoints,0)
		this.lifePoints -= totalDamage
		if(this.lifePoints <= 0){
			this.death()
		}
	}
	updateTilesetPosition(newValue){
		this.tileValue = newValue
		this.sor.set(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
	}
	updateTile(x,y){
		const newCell = typeof x === 'object' ? x : Vector2D.add(this.cell, new Vector2D(x,y))
		if(canvas.isValidCell(newCell) && game.isOccupied(newCell)){
			this.cell.set(newCell)
			
			const tile = canvas.getTile(this.cell)
			this.tile.entity = null
			this.tile = tile
			this.tile.entity = this
			this.des = this.tile.des
		} 
	}
	startInteraction(entity){
		this.interactingWith = entity
		this.interactingWith.interactingWith = this
		dialogBox.activate()
	}
	interaction(){
		switch(this.messageCount){
			case 0: dialogBox.setText('O que você tá olhando? Cai fora.') ; break
			case 1: dialogBox.setText('. . . . . tem algo importante pra me dizer? Não? Então vai embora logo.') ; break
			case 2: dialogBox.setText('Você de novo?/n Por que é que você insiste em me perturbar? Eu não fiz nada pra você, nem sequer te conheço. Serião, tu é muito chato. Faça favor de nunca mais falar comigo. Vai se jogar de um poço ou alguma coisa. Eu conheço um bem perto daqui, se quiser eu te levo lá.') ; break
			default: this.exitInteraction()		
		}
		this.messageCount++
	}
	exitInteraction(){
		this.interactingWith.interactingWith = null
		this.interactingWith = null
		this.interactionCount++
		this.messageCount = -1
		dialogBox.deactivate()
	}
}
export class Player extends BasicEntity{
	constructor(cell){
		super(cell,canvas.images.player)
		this.faction = 'human'

		this.lifePoints = 5
		this.damagePoints = 1
		this.defensePoints = 0
		this.attackRange = 1
		this.attackCooldownDuration = 1
	
		game.player = this
	}
	move(){
		if(input.keys[5]){
			this.attackCooldown--
			this.updateTilesetPosition(0)
			return true
		}

		const direction = new Vector2D
		
		if(input.keys[7]) direction.add(-1,-1)
		if(input.keys[8]) direction.add(+0,-1)
		if(input.keys[9]) direction.add(+1,-1)

		if(input.keys[4]) direction.add(-1,+0)
		if(input.keys[6]) direction.add(+1,+0)

		if(input.keys[1]) direction.add(-1,+1)
		if(input.keys[2]) direction.add(+0,+1)
		if(input.keys[3]) direction.add(+1,+1)
			
		if(direction.x !== 0 || direction.y !== 0){
			if(direction.x !== 0){
				if(direction.x > 0) direction.x = 1
				else if(direction.x < 0) direction.x = -1
			}
			if(direction.y !== 0){
				if(direction.y > 0) direction.y = 1
				else if(direction.y < 0) direction.y = -1
			}
		}
		else return false 

		if(this.interactingWith){
			this.attackCooldown--
			return true
		}
		const newCell = Vector2D.add(this.cell,direction)

		const mapChange = game.changeStage(newCell)
		if(mapChange){
			this.updateTile(mapChange)
			this.attackCooldown--
			this.updateTilesetPosition(0)
			return true
		}
		const entity = canvas.getTile(newCell).entity
		if(entity){
			if(this.faction !== entity.faction){
				if(this.attackCooldown <= 0){
					this.deliverAttack(newCell)
					this.updateTilesetPosition(1)
					return true
				}
				this.attackCooldown--
				this.updateTilesetPosition(0)
				return true
			}
			else{
				entity.startInteraction(this)
				this.attackCooldown--
				this.updateTilesetPosition(0)
				return true
			}
		}
		this.attackCooldown--
		this.updateTilesetPosition(0)
		this.updateTile(newCell)
		return true
	}
}
class NPC extends BasicEntity{
	constructor(cell,image){
		super(cell,image)
		this.engagingMode = 'passive'
		this.attackType = 'singleCardinal'

		this.target = {
			entity: null,
			distance: Infinity,
			path: {length: Infinity}
		}
	}
	findTarget(){
		this.target = {
			entity: null,
			distance: Infinity,
			path: {length: Infinity}
		}
		game.entities.forEach(entity => {
			if(entity.faction !== this.faction){
				game.collisionMap[entity.cell.y][entity.cell.x] = true
				const path = pathfinder.getPath(this.cell,entity.cell,game.collisionMap)

				if(path.length + path[0].h < this.target.path.length + this.target.distance){
					this.target.entity = entity
					this.target.distance = path[0].h
					this.target.path = path
				}
				game.collisionMap[entity.cell.y][entity.cell.x] = false
			}
		})
	}
	move(){
		if(this.interactingWith){
			this.interaction()
			this.attackCooldown--
			return
		}
		this.findTarget()
		if(!this.target.entity){
			this.updateTile(randomInt(-1,1),randomInt(-1,1))
			this.updateTilesetPosition(0)
			this.attackCooldown--
			return
		}

		if(this.attackType === 'singleCardinal'){
			if((this.cell.x === this.target.entity.cell.x || this.cell.y === this.target.entity.cell.y)
			&& this.target.distance <= this.attackRange && this.attackCooldown <= 0){
				this.deliverAttack(this.target.entity.cell)
				this.updateTilesetPosition(1)
			}
			else{
				this.updateTilesetPosition(0)
				if(this.attackCooldown > 0){
					this.attackCooldown--
				}
				else this.updateTile(this.target.path[1])
			}
		}
	}
}
export class Goblin extends NPC{
	constructor(cell){
		super(cell,canvas.images.goblin)
		this.faction = 'monster'
		this.attackType = 'singleCardinal'

		this.lifePoints = 1
		this.damagePoints = 1
		this.defensePoints = 0
		this.attackRange = 1
		this.attackCooldownDuration = 2
	}
}
export class Militia extends NPC{
	constructor(cell){
		super(cell,canvas.images.militia)
		this.faction = 'human'
		this.attackType = 'singleCardinal'

		this.lifePoints = 5
		this.damagePoints = 2
		this.defensePoints = 0.5
		this.attackRange = 2
		this.attackCooldownDuration = 2
	}
}

export class TargetMark{
	constructor(){
		this.tileset = loader.images.targetMark
		this.image = this.tileset.image
		this.tile = null

		this.tileValue = 0
		this.active = false

		this.cell = new Vector2D
		this.des = new Vector2D
		this.sor = new Vector2D
		this.size = new Vector2D

		this.animationDuration = game.targetFrameRate / 10
		this.animationTimer = this.animationDuration
	}
	animate(){
		if(this.animationTimer <= 0){
			this.tileValue++
			if(this.tileValue >= this.tileset.tilecount){
				this.active = false
				return false
			}
			this.updateTilesetPosition(this.tileValue)
			this.animationTimer = this.animationDuration
			return true
		}
		this.animationTimer--
		return true
	}
	setCell(cell){
		this.active = true
		
		this.cell.set(cell)
		this.tile = canvas.getTile(this.cell)
		this.des.set(this.tile.des)
		this.size.set(this.tileset.tilewidth,this.tileset.tileheight)

		this.updateTilesetPosition(0)
	}
	updateTilesetPosition(newValue){
		this.tileValue = newValue
		this.sor.set(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
	}
}