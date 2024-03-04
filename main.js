import {Input} from './scripts/input.js'
import {Canvas} from './scripts/canvas.js'
import {Loader} from './scripts/loader.js'
import {Vector2D,randomInt,randomObjectValue} from './scripts/geometry.js'
import {Pathfinder} from './scripts/pathfinding.js'
import {Area} from './scripts/areas.js'
import {AudioPlayer} from './scripts/audioPlayer.js'
import {
	DialogBox,
	Inventory,
} from './scripts/interface.js'

import * as Entities from './scripts/entities.js'
import * as Items from './scripts/items.js' 

Array.prototype.findAndRemove = function (item){
	for(let i = 0; i < this.length;i++){
		if(item === this[i]) this.splice(i,1)
	}
}
class Game{
	constructor(){
		this.resolution = new Vector2D(1280,704)

		this.desiredFPS = 60
		this.targetFrameRate = 1000 / this.desiredFPS
		this.deltaTime = 1
		this.lastTimeMeasure = performance.now()
		this.running = false

		this.currentArea = null
		this.pausedArea = null

		this.userInterfaces = []
		this.interfaceOpen = false
		
		this.player = null
		this.deleteQueue = []

		this.drawGrid = false
	}
	convertDisplayItem(item){
		return new Items[item.data.constructorName](item.data)
	}
	changeArea(cell,direction){
		const left = Number(cell.x + direction.x === -1)
		const top = Number(cell.y + direction.y === -1)
		const right = Number(cell.x + direction.x === this.currentArea.size.x)
		const down = Number(cell.y + direction.y === this.currentArea.size.y)

		if(!left && !top && !right && !down) return false

		const xPositive = direction.x > 0
		const xNegative = direction.x < 0
		const yPositive = direction.y > 0
		const yNegative = direction.y < 0

		const possibleDirection = new Vector2D(
			xPositive ? direction.x * right : xNegative ? direction.x * left : 0,
			yPositive ? direction.y * down : yNegative ? direction.y * top : 0,
		)

		const column = this.world.areas[this.currentArea.y + possibleDirection.y]
		const newArea = column ? column[this.currentArea.x + possibleDirection.x] : null

		if(!newArea) return false

		const newCell = new Vector2D(
			possibleDirection.x === 1 ? 0 : possibleDirection.x === -1 ? newArea.size.x-1 : cell.x + direction.x,
			possibleDirection.y === 1 ? 0 : possibleDirection.y === -1 ? newArea.size.y-1 : cell.y + direction.y 
		)

		this.currentArea = newArea
		canvas.setTransition(possibleDirection)

		return [newCell,newArea]
	}
	updateDeltaTime(){
		const actualTime = performance.now()
		this.deltaTime = (actualTime - this.lastTimeMeasure) / this.targetFrameRate
		this.lastTimeMeasure = actualTime
	}
	checkUserInteraction(e){
		this.userInterfaces.forEach(userInterface => {
			userInterface.checkPointerEvents({
				pointer: input.pointer,
				buttons: input.mouse
			})
		})
	}
	tick(){
		requestAnimationFrame(()=>this.tick())
		if(!this.running || !document.hasFocus()){
			this.lastTimeMeasure = performance.now()
			return
		}
		this.updateDeltaTime()
		
		this.checkUserInteraction()

		const areaToTest = new Vector2D(this.pausedArea)

		loop1: for(let y = areaToTest.y;y < this.world.areas.length;y++){
		loop2: for(let x = areaToTest.x;x < this.world.areas[y].length;x++){
			const area = this.world.areas[y][x]
			if(area){
				if(!area.manageTurns()){
					this.pausedArea = area
					break loop1
				}
			}
			this.pausedArea = null
		}}	

		canvas.clear()
		canvas.screenShake()
		for(let y = 0; y < this.world.areas.length;y++){
		for(let x = 0; x < this.world.areas[y].length;x++){
			const area = this.world.areas[y][x]
			if(area){
				area.entities.forEach(entity => entity.movementTranslation())
				area.projectiles.forEach(projectile => {
					projectile.animate()
					projectile.movementTranslation()
				})
				for(const effectGroup in area.effects){
					area.effects[effectGroup].forEach(effect => effect.playAnimation())
				}
			}
		}}

		for(let i = this.deleteQueue.length-1; i >= 0; i--){
			const request = this.deleteQueue[i]
			const item = request.item

			if(!item.mvtTranslation.running){
				if(request.SFX) item.area.playAreaAudio(request.SFX)
				if(item.blood) item.blood.drop(item.cell,item.area)

				if(request.VFX) request.VFX.forEach(VFX => VFX.active = true)
				request.arr.findAndRemove(item)
				this.deleteQueue.splice(i,1)
			}
		}
		

		this.currentArea.drawFirstLayer()
		if(game.drawGrid){
			canvas.drawGrid()
			this.currentArea.entities.forEach(entity => {
				if(entity === game.player || !entity.target.cells[0]) return
				entity.target.cells.forEach(cell => {
					const tile = this.currentArea.getTile(cell)
					tile.stroke = '#f00'
					canvas.drawRect(tile)
					tile.stroke = '#333'
				})
			})
			this.player.autoPath.forEach(tile => {
				tile.stroke = '#ff0'
				canvas.drawRect(tile)
				tile.stroke = '#333'
			})
		}

		this.currentArea.entities.forEach(entity => canvas.drawImage(entity))
		this.currentArea.projectiles.forEach(projectile => canvas.drawImage(projectile))		
		this.currentArea.drawOtherLayers()
		this.currentArea.entities.forEach(entity => entity.lifeBars.forEach(bar => canvas.drawRect(bar)))

		for(const effectGroup in this.currentArea.effects){
			this.currentArea.effects[effectGroup].forEach(effect => {
				if(effect.active) effect.draw()
			})
		}
		canvas.drawTransition()
		canvas.drawUI(this.userInterfaces)
	}
	addInterface(newInterface){
		this.userInterfaces.push(newInterface)
		return newInterface
	}
	loadSave(){
		this.save = Object.assign({
			roomX: 1, 	
			roomY: 1,
			playerX: 5,
			playerY: 5,
		},localStorage)
	}
	saveProgress(){
		localStorage.setItem('roomX',this.currentArea.x)
		localStorage.setItem('roomY',this.currentArea.y)
		localStorage.setItem('playerX',this.player.cell.x)
		localStorage.setItem('playerY',this.player.cell.y)
	}
}	
function initialLoad(){
	window.loader = new Loader
	loader.loadWorld([
		'player.tsx',
		'goblin.tsx',
		'militia.tsx',
		'targetMark.tsx',
		'potato.tsx',
		'goblinRanged.tsx',
		'thrownRock.tsx',
		'greatSwordKnight.tsx',
		'knife.tsx',
		'spear.tsx',
		'greatSword.tsx',
		'clashBreak.tsx',
		'clashBlock.tsx',
		'rock.tsx',
		'puddleHumanBlood.tsx',
		'trailHumanBlood.tsx',
		'puddleGoblinBlood.tsx',
		'trailGoblinBlood.tsx',
		'hunter.tsx',
		'arrowProjectile.tsx',
		'bow.tsx',
		'peasant.tsx'
	],[
		'throw.wav',	
		'rockHit.wav',
		'swordSlash1.wav',
		'swordSlash2.wav',
		'knifeStab.wav',
		'clash.wav',
		'miss.wav',
		'pullBow.wav',
		'arrowHit.wav'
	])
	.then((result) => {
		window.game = new Game
		game.loadSave()

		for(let y = 0; y < result[0].areas.length;y++){
		for(let x = 0; x < result[0].areas[y].length;x++){
			if(result[0].areas[y][x]){
				result[0].areas[y][x] = new Area(result[0].areas[y][x])
			}
		}}
		game.world = result[0]

		window.canvas = new Canvas
		window.input = new Input(canvas.c)
		window.pathfinder = new Pathfinder
		window.audioPlayer = new AudioPlayer(result[2])

		window.dialogBox = game.addInterface(new DialogBox)
		window.inventoryInterface = game.addInterface(new Inventory)

		game.currentArea = game.world.areas[game.save.roomY][game.save.roomX]
		new Entities.Player(new Vector2D(game.save.playerX,game.save.playerY))
				

		const entityQuantity = 0
		const possibleEntities = Object.assign({},Entities)
		delete possibleEntities.Player
		// delete possibleEntities.Militia
		// delete possibleEntities.GreatSwordKnight
		// delete possibleEntities.GoblinRogue
		// delete possibleEntities.GoblinRanged
		// delete possibleEntities.Hunter
		// delete possibleEntities.Peasant

		const itemQuantity = 2
		const possibleItems = Object.assign({},Items)
		delete possibleItems.None
		delete possibleItems.PuddleHumanBlood
		delete possibleItems.PuddleGoblinBlood
		delete possibleItems.TrailHumanBlood
		delete possibleItems.TrailGoblinBlood

		for(let y = 0; y < game.world.areas.length;y++){
		for(let x = 0; x < game.world.areas[y].length;x++){
			const area = game.world.areas[y][x]
			if(area){
				for(let i = 0; i < entityQuantity; i++){
					const cell = new Vector2D(randomInt(0,area.size.x-1),randomInt(0,area.size.y-1))
					if(!area.isFreeCell(cell)){
						i--
						continue
					}
					new Entities[randomObjectValue(possibleEntities)](cell,area)

				}
				for(let i = 0; i < itemQuantity;i++){
					const cell = new Vector2D(randomInt(0,area.size.x-1),randomInt(0,area.size.y-1))
					if(!area.isFreeCell(cell)){
						i--
						continue
					}
					const item = new Items[randomObjectValue(possibleItems)]
					item.drop(cell,area)
				}
			}
		}}
		game.running = true
		
		game.tick()
	})
}

initialLoad()
/* A Fazer
2. AI...?
3. Concertar o movimento... e por consequencia o manejamento de turnos
4. Mapa(ou minimapa)
5. Salvamento de progresso, incluindo entidades e objetos do ambiente
6. Novos items, armas e consumiveis
7. Melhorar dialogos, com escolhas e etc
*/


/*
Ideias para Adicionar

Bugs a consertar:
- Ao trocar de area, se uma entidade estiver na celúla da qual o jogador iria ocupar, ele fica na mesma posição
da sala anterior, dando a impressão que ele se 'teleporta' pro outro lado da sala. 
*/