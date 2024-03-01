import {Vector2D,toRadian} from './geometry.js'
import * as Projectiles from './projectiles.js'

class BaseItem{
	constructor(tileset,data){
		if(tileset){
			this.tileset = tileset
			this.image = tileset.image
			this.tileValue = 0	
		}
		if(data) Object.assign(this,data)
		else{
			this.user = null
			this.name = '???'
			this.description = '???'
			this.effectDescription = '???'
			this.category = '???'
			this.specialEffect = () => {}
			this.cellSize = new Vector2D(1,1)
		}
		this.pickupable = true
		this.interactible = false
	}
	storeData(){
		const data = {constructorName: this.constructor.name}

		for(const [key,value] of Object.entries(this)){
			data[key] = value
			if(!(key === 'tileset'
			|| key === 'image'
			|| key === 'tileValue'
			|| key === 'pickupable')) delete this[key]
		}
		this.data = data	
		return this.data
	}
	drop(cell,area){
		if(this.pickupable) this.storeData()

		this.area = area ? area : game.currentArea
		this.cell = new Vector2D(cell)
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
		this.tile.items.push(this)
	}
	getPicked(){
		this.tile.items.findAndRemove(this)
		this.tile = null
	}
	updateTilesetPosition(newValue){
		if(newValue) this.tileValue = newValue
		this.sor.set(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
	}
}
export class Potato extends BaseItem{
	constructor(data){
		super(loader.images.potato,data)
		this.name = 'Batata'
		this.description = 'Uma batata normal. Crua, porem saudável.'
		this.category = 'healing'
		this.damage = 1
	}
}
class Weapon extends BaseItem{
	constructor(tileset,data){
		super(tileset,data)
		this.category = 'weapon'
		this.type = '???'

		this.damage = 1
		this.range = 1
		this.strength = 0
		this.cooldown = 0

		this.charging = false
		this.chargingProgress = 0
		this.chargingDuration = 0
		this.preChargeData = null

		this.attackSFX = null
		this.chargingSFX = null
	}
	equip(user){
		this.user = user
		this.user.weapon = this
		return this
	}
	unEquip(){
		this.user.weapon = new None
		this.user = null
		return this
	}
	charge(){
		if(this.chargingDuration && !this.charging){
			this.charging = true
			this.chargingProgress = this.chargingDuration
			this.user.updateTilesetPosition(this.user.tilesetValues.charging)
			if(this.chargingSFX) this.user.area.playAreaAudio(this.chargingSFX) 
		}
		else{
			if(this.chargingProgress > 0) this.chargingProgress--
			if(!this.chargingProgress){
				this.charging = false
				this.preChargeData = null
			}
		}
		return this.charging
	}
	attack(passedDirection){
		let direction
		
		if(passedDirection){
			direction = passedDirection
		}
		else{
			const target = this.user.target
			const inSameLine = this.user.cell.x === target.cell.x || this.user.cell.y === target.cell.y
			const inRange = target.distance <= this.range

			if(!(inSameLine && inRange)) return false
			direction = Vector2D.sub(target.cell,this.user.cell).limitTo(1)
		}

		if(this.charge()){
			this.preChargeData = direction
			return true
		}

		return this.user.area.getTilesBetween(
			this.user.cell,
			Vector2D.mult(direction,this.range + 1).add(this.user.cell)
		).tiles
	}
}
export class None extends Weapon{
	constructor(){
		super()	
		this.damage = 0.5
	}
}
export class Knife extends Weapon{
	constructor(data){
		super(loader.images.knife,data)

		this.type = 'dagger'
		this.name = 'Faca'
		this.description = 'Pontuda e leve, perfeita para ataques sorrateiros.'
		this.cellSize.set(1,2)

		this.attackSFX = 'knifeStab'
	}
}
export class Spear extends Weapon{
	constructor(data){
		super(loader.images.spear,data)
		this.type = 'spear'
		this.name = 'Lança'
		this.description = 'Uma lança simples, comum entre mílicias e guardas locais. Capaz de desferir golpes de uma distancia mais confortável.'
		this.cellSize.set(1,4)

		this.damage = 2
		this.range = 2
		this.strength = 1
		this.cooldown = 1
	}
}
export class GreatSword extends Weapon{
	constructor(data){
		super(loader.images.greatSword,data)
		this.type = 'greatSword'
		this.name = 'Espada Pesada'
		this.description = 'Uma espada pesada.'
		this.cellSize.set(2,4)

		this.damage = 3
		this.range = 1
		this.strength = 3
		this.cooldown = 2
		this.attackSFX = 'swordSlash2'
		this.chargingDuration = 1
	}
	attack(passedDirection){
		let direction
		if(passedDirection){
			direction = passedDirection
		}
		else{
			const target = this.user.target
			const inSameLine = this.user.cell.x === target.cell.x || this.user.cell.y === target.cell.y
			const inRange = target.distance <= this.range

			if(!(inSameLine && inRange)) return false

			direction = Vector2D.sub(target.cells[1],this.user.cell).limitTo(1)
		}

		if(this.charge()){
			this.preChargeData = direction
			return true
		}

		const tiles = this.user.area.getTilesBetween(this.user.cell,Vector2D.mult(direction,this.range+1).add(this.user.cell)).tiles
		
		if(direction.x !== 0 && direction.y !== 0){
			tiles.push(
				...this.user.area.getTilesBetween(this.user.cell,Vector2D.mult({x:direction.x,y:0},this.range+1).add(this.user.cell)).tiles,
				...this.user.area.getTilesBetween(this.user.cell,Vector2D.mult({x:0,y:direction.y},this.range+1).add(this.user.cell)).tiles
			)
		}
		else if(direction.x !== 0){
			tiles.push(
				...this.user.area.getTilesBetween(this.user.cell,Vector2D.mult({x:0,y:1},this.range+1).add(this.user.cell)).tiles,
				...this.user.area.getTilesBetween(this.user.cell,Vector2D.mult({x:0,y:-1},this.range+1).add(this.user.cell)).tiles
			)
		}
		else if(direction.y !== 0){
			tiles.push(
				...this.user.area.getTilesBetween(this.user.cell,Vector2D.mult({x:1,y:0},this.range+1).add(this.user.cell)).tiles,
				...this.user.area.getTilesBetween(this.user.cell,Vector2D.mult({x:-1,y:-0},this.range+1).add(this.user.cell)).tiles
			)
		}
		return tiles
	}
}
class RangedWeapon extends Weapon{
	constructor(tileset,data){
		super(tileset,data)
		this.type = 'ranged'
		this.projectile = null
	}
	getRangedData(){
		const target = this.user.target
		const data = this.user.area.getTilesBetween(this.user.cell,target.cell)
		data.hitsSomethingElse = false

		for(const tile of data.tiles){
			const entity = tile.entity
			if(tile.blocked || entity && entity.faction === this.user.faction){
				data.hitsSomethingElse = true
				break
			}
		}
		return data
	}
	attack(passedDirection){
		let direction
		if(passedDirection){
			direction = passedDirection
		}
		else{
			const target = this.user.target
			const inSameLine = this.user.cell.x === target.cell.x || this.user.cell.y === target.cell.y
			const inRange = target.distance <= this.range
			
			const rangedData = this.getRangedData()

			if(!(inSameLine && inRange && !rangedData.hitsSomethingElse)){ 
				return false
			}
			direction = rangedData.direction
		}

		if(this.charge()){
			this.preChargeData = direction
		}
		else{
			new Projectiles[this.projectile](this.user,direction)
			this.user.cooldown += this.cooldown
			this.user.updateTilesetPosition(this.user.tilesetValues.attack)
			this.user.area.playAreaAudio(this.attackSFX)			
		}
		
		return true
	}
}
export class Rock extends RangedWeapon{
	constructor(data){
		super(loader.images.rock,data)
		this.name = 'Pedra'
		this.description = 'Uma pedra.'

		this.damage = 1
		this.range = 5
		this.attackSFX = 'throw'
		this.projectile = 'Rock'
		this.chargingDuration = 1
	}
}
export class Bow extends RangedWeapon{
	constructor(data){
		super(loader.images.bow,data)
		this.name = 'Arco'
		this.description = 'Um arco.'

		this.damage = 2
		this.range = 8
		this.chargingSFX = 'pullBow'
		this.projectile = 'Arrow'
		this.chargingDuration = 1
		this.cellSize.set(2,3)
	}
}
class Puddle extends BaseItem{
	constructor(tileset){
		super(tileset)
		this.pickupable = false
		this.interactible = true
		
		this.maxLifeSpan = 100
		this.lifeSpan = this.maxLifeSpan
		this.lastTileValue = this.tileset.tilecount - 1
		this.tilesetChangeInterval = Math.floor(this.maxLifeSpan / this.lastTileValue)
		this.drippingDuration = 35
	}
	interaction(){
		this.tileValue = -(Math.floor(this.lifeSpan / this.tilesetChangeInterval) - this.lastTileValue)
		this.updateTilesetPosition()

		if(this.tile.entity && this.lifeSpan > this.drippingDuration){
			this.tile.entity.steppedPuddle = this
			this.tile.entity.drippingDuration = this.drippingDuration
		}
		this.lifeSpan--
		if(this.lifeSpan <= 0) this.tile.items.findAndRemove(this)
	}
}
export class PuddleHumanBlood extends Puddle{
	constructor(){
		super(loader.images.puddleHumanBlood)
		this.trail = 'TrailHumanBlood'
	}
}
export class PuddleGoblinBlood extends Puddle{
	constructor(){
		super(loader.images.puddleGoblinBlood)
		this.trail = 'TrailGoblinBlood'
	}	
}
class Trail extends BaseItem{
	constructor(tileset,originalPuddle,cell,area,direction){
		super(tileset)

		this.originalPuddle = originalPuddle
		this.pickupable = false
		this.interactible = true

		this.maxLifeSpan = originalPuddle.maxLifeSpan
		this.lifeSpan = originalPuddle.lifeSpan ? originalPuddle.lifeSpan : this.maxLifeSpan
		this.lastTileValue = this.tileset.tilecount - 1
		this.tilesetChangeInterval = Math.floor(this.maxLifeSpan / this.lastTileValue)

		this.radian = Vector2D.atan2(direction)

		if(cell && area){
			this.drop(cell,area)
			this.updateTilesetPosition(-(Math.floor(this.lifeSpan / this.tilesetChangeInterval) - this.lastTileValue))
		}
	}
	interaction(){
		this.tileValue = -(Math.floor(this.lifeSpan / this.tilesetChangeInterval) - this.lastTileValue)
		this.updateTilesetPosition()
			
		if(--this.lifeSpan <= 0) this.tile.items.findAndRemove(this)
	}
}
export class TrailHumanBlood extends Trail{
	constructor(puddle,cell,area,direction){
		super(loader.images.trailHumanBlood,puddle,cell,area,direction)
	}
}
export class TrailGoblinBlood extends Trail{
	constructor(puddle,cell,area,direction){
		super(loader.images.trailGoblinBlood,puddle,cell,area,direction)
	}
}