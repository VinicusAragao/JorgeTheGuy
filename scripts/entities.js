import {Vector2D,randomInt} from './geometry.js'
import * as Items from './items.js'
import {RelationManager} from './relations.js'

class LifeBar{
	constructor(entity){
		this.entity = entity
		this.fill = '#f00'
		this.stroke = '#ff0'
		this.strokeWidth = 0.2

		this.des = new Vector2D
		this.size = new Vector2D
		this.id = this.entity.lifeBars.length
		this.colors = ['#600','#f00']
	}
	update(){
		const row = Math.floor(this.id / 10) + 1
		const col = this.id % 10
		const thing = Math.min(this.entity.lifeBars.length,10)

		this.maxW = this.entity.tile.size.x - thing
		this.size.set(Math.min(this.maxW / thing,this.maxW),2.5)

		this.des.set(this.entity.des)
		this.des.add(this.size.x * col + col,-3 * row)
		
		this.toggle(this.entity.lifePoints > this.id) 
	}
	toggle(state){
		this.active = state
		this.fill = this.colors[Number(this.active)]
	}
}

class BasicEntity{
	constructor(cell,tileset,area){
		this.cell = new Vector2D(cell)
		this.tileset = tileset
		this.image = this.tileset.image
		this.area = area ? area : game.currentArea
		this.tile = this.area.getTile(this.cell)
		this.des = new Vector2D(this.tile.des)
		this.size = new Vector2D(this.tileset.tilewidth,this.tileset.tileheight)
		this.tileValue = 0
		this.sor = new Vector2D

		this.faction = 'none'
		this.alive = true
		this.name = '???'
		this.occupiesTiles = true
		this.walksDiagonally = false
		
		this.mvtTranslation = {
			direction: new Vector2D,
			speed: new Vector2D,
			progress: new Vector2D,
			running: false,
		}

		this.tile.entity = this

		this.tilesetValues = {
			walking: 0,
			attack: 0,
			charging: 0,
			cooldown: 0,
		}

		this.setLifePoints(0)
		this.damage = 0
		this.defense = 0
		this.strength = 0
		this.cooldown = 0

		new Items.None().equip(this)

		this.steppedPuddle = null
		this.drippingDuration = 0

		this.deliveredAttacks = []
		this.movementRequest = null

		this.interactingWith = null
		this.interactionCount = 0
		this.messageCount = 0

		this.relationManager = new RelationManager(this)

		this.area.entities.push(this)
		this.area.updateCollisionMap(this.cell)
	}
	updateBars(){
		this.lifeBars.forEach(bar => bar.update())
	}
	setLifePoints(points){
		this.maxLifePoints = points
		this.lifePoints = this.maxLifePoints
		this.lifeBars = []

		for(let i = 0; i < points;i++){
			this.lifeBars.push(new LifeBar(this))
		}
		this.updateBars()
	}
	death(){
		this.alive = false
		this.tile.entity = null
		this.movementRequest = null
		this.deliveredAttacks = []

		this.relationManager.clearAllRelations()
		if(this.interactingWith) this.exitInteraction()

		this.area.updateCollisionMap(null,this.cell)
		game.deleteQueue.push({
			item: this,
			arr: this.area.entities,
		})	
	}
	queueAttack(direction){
		const result = this.weapon.attack(direction)

		if(result && result.length > 0){
			result.forEach(tile => this.deliveredAttacks.push({
				attacker: this,
				weapon: this.weapon,
				targetTile: tile,
				blocked: false
			}))	
		}
		return Boolean(result)
	}
	calculateDamage(damageDealer){
		let totalDamage = 0
		switch(damageDealer.weapon.type){
			case 'dagger': totalDamage = this.cooldown ? damageDealer.weapon.damage * 2 : damageDealer.weapon.damage - this.defense
			break
			default: totalDamage = damageDealer.weapon.damage - this.defense
		}
		totalDamage = Math.max(totalDamage,0)

		this.relationManager.gotAttackedBy(damageDealer)

		this.lifePoints -= totalDamage
		if(this.lifePoints <= 0) this.death()
		
		this.updateBars()		
		return totalDamage
	}
	regenerateLifePoints(points){
		this.lifePoints += points
		if(this.lifePoints > this.maxLifePoints) this.lifePoints = this.maxLifePoints

		this.updateBars()
	}
	updateTilesetPosition(newValue){
		this.tileValue = newValue
		this.sor.set(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
	}
	queueMovement(newCell,newArea){
		if((this.area.isValidCell(newCell) && this.area.isFreeCell(newCell))
		|| newArea){
			if(!newArea) this.startMovementTranslation(newCell)

			this.movementRequest = {
				entity: this,
				oldCell: new Vector2D(this.cell),
				newCell: new Vector2D(newCell),
				oldTile: this.tile,
				newTile: newArea ? newArea.getTile(newCell) : this.area.getTile(newCell),
				newArea: newArea, 
			}
			return true
		} 
		return false
	}
	startMovementTranslation(newCell){
		this.mvtTranslation.direction.set(Vector2D.sub(newCell,this.cell))
		this.mvtTranslation.speed.set(Vector2D.mult(this.mvtTranslation.direction,this.tile.size))
		this.mvtTranslation.speed.div(this.area.timerDuration).abs()
		this.mvtTranslation.progress.set(Vector2D.mult(this.tile.size,this.mvtTranslation.direction).abs())
		this.mvtTranslation.running = this.mvtTranslation.progress.x > 0 || this.mvtTranslation.progress.y > 0
	}
	movementTranslation(){
		if(this.mvtTranslation.running){
			const addedDes = Vector2D.mult(this.mvtTranslation.speed,game.deltaTime)
			this.des.add(Vector2D.mult(addedDes,this.mvtTranslation.direction))
			this.mvtTranslation.progress.sub(addedDes)
			
			if(this.mvtTranslation.progress.x <= 0 && this.mvtTranslation.progress.y <= 0){
				this.mvtTranslation.running = false
				this.des.set(this.tile.des)

				this.dripLiquid()
			}
			this.updateBars()
		}
	}
	dripLiquid(){
		if(this.steppedPuddle){
			if(this.drippingDuration > 0){
				this.drippingDuration--
				return new Items[this.steppedPuddle.trail](this.steppedPuddle,this.cell,this.area,this.mvtTranslation.direction)
			}
			else this.steppedPuddle = null
		}
	}
	startInteraction(entity){
		this.interactingWith = entity
		entity.interactingWith = this
		dialogBox.activate(this.name)
	}
	interaction(){
		switch(this.messageCount){
			case 0: dialogBox.setText('O que você tá olhando? Cai fora.'); break
			case 1: dialogBox.setText('. . . . . tem algo importante pra me dizer? Não? Então vai embora logo.'); break
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
	reduceCooldown(){
		if(this.cooldown){
			this.cooldown--
			this.updateTilesetPosition(this.tilesetValues.cooldown)
		}
	}
}
export class Player extends BasicEntity{
	constructor(cell){
		super(cell,loader.images.player)
		this.faction = 'human'
		this.setLifePoints(3)

		this.targetTile = null
		this.autoPath = []
		this.walksDiagonally = true

		this.inventory = window.inventoryInterface
		this.inventory.user = this

		this.inventory.addItem(new Items.Bow())
		this.inventory.useItem(this.inventory.items[0])

		this.tilesetValues.attack = 1
		this.choosingAttackDirection = false
		this.blood = new Items.PuddleHumanBlood()

		game.player = this
	}
	pickupItem(){
		for(const item of this.tile.items){
			if(!item.pickupable) continue
			item.getPicked()
			window.inventoryInterface.addItem(item)
			return true
		}
		return false
	}
	move(){
		if(game.interfaceOpen && !this.interactingWith) return false

		if(this.weapon.charging){
			this.queueAttack(this.weapon.preChargeData)
			return true
		}

		if(this.cooldown){
			this.updateTilesetPosition(this.tilesetValues.cooldown)
			return true
		}

		if(input.keys[5] || input.keys['s']) return true

		if(input.keys['Enter'] || input.keys['f']) return this.pickupItem()

		if(input.keys[0] || input.keys['v']){
			this.choosingAttackDirection = !this.choosingAttackDirection
			input.keys[0] = false
			input.keys['v'] = false
		}

		const direction = new Vector2D
		if(input.keys[7] || input.keys['q']) direction.add(-1,-1)
		if(input.keys[8] || input.keys['w']) direction.add(+0,-1)
		if(input.keys[9] || input.keys['e']) direction.add(+1,-1)
		if(input.keys[4] || input.keys['a']) direction.add(-1,+0)
		if(input.keys[6] || input.keys['d']) direction.add(+1,+0)
		if(input.keys[1] || input.keys['z']) direction.add(-1,+1)
		if(input.keys[2] || input.keys['x']) direction.add(+0,+1)
		if(input.keys[3] || input.keys['c']) direction.add(+1,+1)	
		
		if(direction.x !== 0 || direction.y !== 0){
			this.targetTile = null
			this.autoPath = []
		}
		else if(this.targetTile){
			if(this.targetTile === this.tile && this.autoPath.length === 0){
				this.targetTile = null
				return true
			}

			this.autoPath = []

			this.area.getPath(this,this.targetTile.cell).cells.forEach(cell => {
				this.autoPath.push(this.area.getTile(cell))
			})
			if(this.autoPath.length > 1){
				direction.set(Vector2D.sub(this.autoPath[1].cell,this.cell))
			}
			else{
				this.targetTile = null
				this.autoPath = []
				return false
			}
		}
		else return false

		if(this.interactingWith){
			this.interactingWith.interaction()
			return true
		}
		
		direction.limitTo(1)

		const newCell = Vector2D.add(this.cell,direction)

		if(this.area.isValidCell(newCell)){
			const entity = this.area.getTile(newCell).entity
			if(this.choosingAttackDirection){
				this.queueAttack(direction)
				
				this.choosingAttackDirection = false
				return true
			}
			if(entity){
				entity.faction !== this.faction ? this.queueAttack(direction) : entity.startInteraction(this)
				return true
			}
			return this.queueMovement(newCell)
		}

		const changeAreaData = game.changeArea(this.cell,direction)
		if(changeAreaData){
			this.queueMovement(changeAreaData[0],changeAreaData[1])
			return true
		}

		return false
	}
}
class NPC extends BasicEntity{
	constructor(cell,image,area){
		super(cell,image,area)

		this.target = {
			entity: null,
			distance: Infinity,
			cells: {length: Infinity},
			cell: new Vector2D,
			isPossible: false
		}
		this.behaviour = "aggressive" 
		// when noticing a enemy:
		// passive = flees
		// aggressive = figths
	}
	findTarget(){
		this.target = {
			entity: null,
			distance: Infinity,
			cells: {length: Infinity},
			cell: new Vector2D,
			isPossible: false
		}
		this.area.entities.forEach(entity => {
			// if(entity !== this){
			if(entity.faction !== this.faction || this.relationManager.hostilityAgainst(entity)){
				const path = this.area.getPath(this,entity.cell) 

				if(!path.isPossible && this.target.isPossible) return

				if(path.length + path.cells[0].h < this.target.cells.length + this.target.distance){
					this.target.entity = entity
					this.target.distance = path.cells[0].h
					this.target.cells = path.cells
					this.target.cell = entity.cell
					this.target.isPossible = path.isPossible
				}
			}
		})
		return this.target.entity
	}
	move(){
		if(this.interactingWith){
			if(!this.interactingWith.alive) this.exitInteraction()
			else return true
		}

		if(this.cooldown){
			this.updateTilesetPosition(this.tilesetValues.cooldown)
			return true
		}

		if(this.weapon.charging){
		 	this.queueAttack(this.weapon.preChargeData) 
		}
		else if(this.findTarget()){
			if(this.behaviour === 'aggressive'){
				if(!this.queueAttack()){
					const path = this.target.cells[1] ? this.target.cells[1] : this.target.cells[0]
					this.queueMovement(path)	
				}
			}
			else if(this.behaviour === 'passive'){
				
			}
		}
		else{
			const axis = Boolean(randomInt(0,1))
			const direction = -1 + (2 * randomInt(0,1))
			const newCell = Vector2D.add(this.cell,new Vector2D(Number(axis) * direction,Number(!axis) * direction))

			this.queueMovement(newCell)
		}
		return true
	}
}
class Goblin extends NPC{
	constructor(cell,image,area){
		super(cell,image,area)
		this.faction = 'monster'
		this.setLifePoints(1)
		this.blood = new Items.PuddleGoblinBlood()
	}
}
class Human extends NPC{
	constructor(cell,image,area){
		super(cell,image,area)
		this.faction = 'human'
		this.setLifePoints(3)
		this.blood = new Items.PuddleHumanBlood()
	}
}
export class GoblinRogue extends Goblin{
	constructor(cell,area){
		super(cell,loader.images.goblin,area)

		new Items.Knife().equip(this)
		this.tilesetValues.attack = 1
	}
}
export class GoblinRanged extends Goblin{
	constructor(cell,area){
		super(cell,loader.images.goblinRanged,area)

		new Items.Rock().equip(this)

		this.tilesetValues.charging = 1
		this.tilesetValues.attack = 2
	}
}
export class Militia extends Human{
	constructor(cell,area){
		super(cell,loader.images.militia,area)
		new Items.Spear().equip(this)
	
		this.tilesetValues.attack = 1
	}
}
export class GreatSwordKnight extends Human{
	constructor(cell,area){
		super(cell,loader.images.greatSwordKnight,area)
		this.defense = 1
		new Items.GreatSword().equip(this)

		this.tilesetValues.charging = 1
		this.tilesetValues.attack = 2
	}
}
export class Hunter extends Human{
	constructor(cell,area){
		super(cell,loader.images.hunter,area)
		new Items.Bow().equip(this)

		this.tilesetValues.charging = 1
		this.tilesetValues.attack = 2
	}
}
export class Peasant extends Human{
	constructor(cell,area){
		super(cell,loader.images.peasant,area)
		this.behaviour = 'passive'
	}
}