import {Vector2D,getManhatthanDistance,randomInt} from './geometry.js'
import * as Projectiles from './projectiles.js'

class BasicEntity{
	constructor(x,y,tileset,area){
		this.cell = new Vector2D(x,y)
		this.tileset = tileset
		this.image = this.tileset.image

		this.area = area ? area : game.currentArea

		this.tile = this.area.getTile(this.cell)
		this.des = this.tile.des
		this.size = new Vector2D(this.tileset.tilewidth,this.tileset.tileheight)
		
		this.tileValue = 0
		this.sor = new Vector2D(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)

		this.walkingTileValue = 0
		this.attackTileValue = 0
		this.chargingTileValue = 0
		this.cooldownTileValue = 0

		this.faction = 'none'
		this.alive = true
		this.lifePoints = 0
		this.damagePoints = 0
		this.defensePoints = 0

		this.chargingDuration = 0
		this.chargingTimer = this.chargingDuration

		this.attackCooldown = 0
		this.attackCooldownDuration = 0
		this.rangedAttackData = {tiles: [],hitsAlly: false}

		this.interactingWith = null
		this.interactionCount = 0
		this.messageCount = 0

		this.updateTile(this.cell)
		this.area.entities.push(this)
	}
	death(){
		this.alive = false
		this.tile.entity = null
		this.area.entities.findAndRemove(this)
	}
	deliverAttack(cell){
		this.area.getEffectObject('TargetMark',[this.area]).activate(cell)

		const tile = this.area.getTile(cell)
		const entity = tile.entity

		let totalDamage = 0  
		if(entity) totalDamage = entity.calculateDamage(this.damagePoints)

		this.area.getEffectObject('DamageNumber').activate(
			totalDamage,
			Vector2D.add(tile.des,Vector2D.div(tile.size,2))
		)
		this.attackCooldown = this.attackCooldownDuration
	}
	deliverProjectileAttack(){
		new Projectiles.Rock(this.area,this.rangedAttackData)
		this.attackCooldown = this.attackCooldownDuration
	}
	calculateDamage(damage){
		const totalDamage = Math.max(damage - this.defensePoints,0)
		this.lifePoints -= totalDamage
		if(this.lifePoints <= 0){
			this.death()
		}
		return totalDamage
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

		if(this.area.isValidCell(newCell) && this.area.isOccupied(newCell)){
			this.cell.set(newCell)

			this.tile.entity = null
			this.tile = this.area.getTile(this.cell)
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
	moveToAnotherArea(newArea){
		this.area.entities.findAndRemove(this)
		this.area = newArea[1]
		this.area.entities.push(this)
		this.updateTile(newArea[0])
	}
	getRangedAttackData(){
		this.rangedAttackData.hitsAlly = false
		Object.assign(
			this.rangedAttackData,
			this.area.getTilesBetween(this.cell,this.target.cell)
		)
		this.rangedAttackData.tiles.forEach(tile => {
			if(tile.entity && tile.entity.faction === this.faction){
				this.rangedAttackData.hitsAlly = true
				return
			}
		})
		return this.rangedAttackData
	}
}
export class Player extends BasicEntity{
	constructor(x,y,area){
		super(x,y,loader.images.player,area)
		this.faction = 'human'

		this.lifePoints = 5
		this.damagePoints = 1
		this.defensePoints = 0
		this.attackRange = 1
		this.attackCooldownDuration = 1
	
		this.inventory = []
		game.player = this
	}
	pickupItem(){
		const item = this.tile.items[0]
		if(item){
			this.inventory.push(item)
			item.getPicked()
			window.inventoryInteface.addItem(item)
		}
	}
	move(){
		if(input.keys[5]){
			this.attackCooldown--
			this.updateTilesetPosition(0)
			return true
		}
		if(input.keys['Enter']){
			this.pickupItem()
			this.attackCooldown--
			this.updateTilesetPosition(0)
			input.keys['Enter'] = false
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
		const newArea = game.changeArea(this.cell,direction)

		if(newArea){
			this.moveToAnotherArea(newArea)
			this.attackCooldown--
			this.updateTilesetPosition(0)
			return true
		}
		else if(this.area.isValidCell(newCell)){
			const entity = this.area.getTile(newCell).entity
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
			this.updateTile(newCell)
			this.attackCooldown--
			this.updateTilesetPosition(0)
			return true
		}
		return false
	}
}
class NPC extends BasicEntity{
	constructor(x,y,image,area){
		super(x,y,image,area)
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
			path: {length: Infinity},
			cell: new Vector2D
		}
		this.area.entities.forEach(entity => {
			if(entity.faction !== this.faction){
				this.area.collisionMap[entity.cell.y][entity.cell.x] = true
				const path = pathfinder.getPath(this.cell,entity.cell,this.area.collisionMap)

				if(path.length + path[0].h < this.target.path.length + this.target.distance){
					this.target.entity = entity
					this.target.distance = path[0].h
					this.target.path = path
					this.target.cell = entity.cell
				}
				this.area.collisionMap[entity.cell.y][entity.cell.x] = false
			}
		})
		return this.target.entity
	}
	move(){
		if(this.interactingWith){
			this.interaction()
			this.attackCooldown--
			return
		}

		if(this.attackCooldown > 0){
			this.attackCooldown--
			this.updateTilesetPosition(this.cooldownTileValue)
			return
		}
		if(!this.findTarget()){
			this.updateTile(randomInt(-1,1),randomInt(-1,1))
			this.updateTilesetPosition(this.walkingTileValue)
			return
		}

		if(this.attackType === 'singleCardinal'){
			if((this.cell.x === this.target.cell.x || this.cell.y === this.target.cell.y)
			&& this.target.distance <= this.attackRange){
				this.deliverAttack(this.target.cell)
				this.updateTilesetPosition(this.attackTileValue)
				return
			}
		}
		if(this.attackType === 'rangedCardinal'){
			if(this.chargingTimer > 0){
				this.chargingTimer--
				this.deliverProjectileAttack()
				this.updateTilesetPosition(this.attackTileValue)
				return				
			}
			else if((this.cell.x === this.target.cell.x || this.cell.y === this.target.cell.y)
			&& this.target.distance <= this.attackRange && !this.getRangedAttackData().hitsAlly){
				this.chargingTimer = this.chargingDuration
				this.updateTilesetPosition(this.chargingTileValue)				
				return
			}
		}

		this.updateTile(this.target.path[1])
	}
}
export class Goblin extends NPC{
	constructor(x,y,area){
		super(x,y,loader.images.goblin,area)
		this.faction = 'monster'
		this.attackType = 'singleCardinal'

		this.lifePoints = 1
		this.damagePoints = 1
		this.defensePoints = 0
		this.attackRange = 1
		this.attackCooldownDuration = 1

		this.attackTileValue = 1
	}
}
export class GoblinRanged extends NPC{
	constructor(x,y,area){
		super(x,y,loader.images.goblinRanged,area)
		this.faction = 'monster'
		this.attackType = 'rangedCardinal'

		this.lifePoints = 1
		this.damagePoints = 0.5
		this.defensePoints = 0
		this.attackRange = 3
		this.attackCooldownDuration = 1

		this.chargingDuration = 1
		this.chargingTimer = 0

		this.chargingTileValue = 1
		this.attackTileValue = 2
	}
}
export class Militia extends NPC{
	constructor(x,y,area){
		super(x,y,loader.images.militia,area)
		this.faction = 'human'
		this.attackType = 'singleCardinal'

		this.lifePoints = 5
		this.damagePoints = 2
		this.defensePoints = 0.5
		this.attackRange = 2
		this.attackCooldownDuration = 2
	
		this.attackTileValue = 1
	}
}
