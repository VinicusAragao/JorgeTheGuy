import {Vector2D,toRadian} from './geometry.js'
import {DrawableObject} from './canvas.js'

class BasicProjectile extends DrawableObject{
	constructor(creator,direction,tileset){
		super(tileset,creator.cell,creator.area)
		this.creator = creator

		this.alive = true

		this.direction = direction
		this.traveledDistance = 0
		this.speed = 1

		this.mvtTranslation = {
			direction: new Vector2D,
			speed: new Vector2D,
			progress: new Vector2D,
			running: false,
		}

		this.hitSFX = null
		this.area.projectiles.push(this)
	}
	death(playSound,effects){
		if(effects) effects.forEach(effect => effect.active = false)
		game.deleteQueue.push({
			item: this,
			arr: this.area.projectiles,
			SFX: playSound ? this.hitSFX : null,
			VFX: effects,
		})
		this.alive = false
	}
	checkHit(){
		const oldCell = new Vector2D(this.cell)

		for(let i = 0; i < this.speed+1; i++){
			const newCell = Vector2D.add(this.cell,Vector2D.mult(this.direction,Vector2D.limitTo(i,1)))
			this.cell.set(newCell)
			
			if(this.area.isValidCell(newCell)){
				this.tile = this.area.getTile(newCell)
				this.traveledDistance++
			}
			else{
				this.death()
				break
			}

			if(this.tile.entity && this.tile.entity !== this.creator){
				const totalDamage = this.tile.entity.calculateDamage(this.creator)
				
				const distanceModifier = this === game.currentArea ? 1 : 0.5
				canvas.setScreenShake(Math.max(2 * totalDamage,2) * distanceModifier)
				

				this.death(true,[
					this.area.generateEffect('DamageNumber', totalDamage, this.tile),
					this.area.generateEffect('TargetMark', this.tile)
				])
				break
			}
			if(this.tile.blocked){
				this.death(true)
				break
			}
		}
		this.startMovementTranslation(this.cell,oldCell)
	}
	startMovementTranslation(newCell,oldCell){
		const totalTravel = Vector2D.sub(newCell,oldCell)
		this.mvtTranslation.direction.set(Vector2D.limitTo(totalTravel,1))
		this.mvtTranslation.speed.set(Vector2D.mult(this.mvtTranslation.direction,this.speed,this.tile.size))
		this.mvtTranslation.speed.div(this.area.timerDuration).abs()
		this.mvtTranslation.progress.set(Vector2D.mult(this.tile.size,totalTravel)).abs()
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
			}
		}
	}
}
export class Rock extends BasicProjectile{
	constructor(creator,direction){
		super(creator,direction,loader.images.thrownRock)
		this.speed = 3
		this.hitSFX = 'rockHit'
	}
}
export class Arrow extends BasicProjectile{
	constructor(creator,direction){
		super(creator,direction,loader.images.arrowProjectile)
		this.speed = 5
		this.hitSFX = 'arrowHit'
		this.radian = Vector2D.atan2(direction)
	}
}