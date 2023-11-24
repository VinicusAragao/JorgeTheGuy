import {Input} from './scripts/input.js'
import {Canvas} from './scripts/canvas.js'
import {Loader} from './scripts/loader.js'
import {Vector2D,randomInt} from './scripts/geometry.js'
import {Pathfinder} from './scripts/pathfinding.js'
import {Area} from './scripts/areas.js'
import {
	DialogBox,
	Inventory
} from './scripts/interface.js'

import * as Entities from './scripts/entities.js'
import * as Items from './scripts/items.js' 

Array.prototype.findAndRemove = function (item){
	for(let i = 0; i < this.length;i++){
		if(item === this[i]){
			this.splice(i,1)
		}
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
		this.animationRequest = 0

		this.currentArea = null
		this.pausedArea = null
		this.userInterfaces = []
		this.player = null
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
		return [newCell,newArea]
	}
	updateDeltaTime(){
		const actualTime = performance.now()
		this.deltaTime = (actualTime - this.lastTimeMeasure) / this.targetFrameRate
		this.lastTimeMeasure = actualTime
	}
	tick(){
		requestAnimationFrame(()=>this.tick())
		if(!this.running || !document.hasFocus()){
			this.lastTimeMeasure = performance.now()
			return
		}
		this.updateDeltaTime()
		
		if(input.keys.e){
			inventoryInteface.toggle()
			input.keys.e = false
		}

		let areaToTest = this.pausedArea ? new Vector2D(this.pausedArea.x,this.pausedArea.y) : new Vector2D

		loop1: for(let y = areaToTest.y;y < this.world.areas.length;y++){
		loop2: for(let x = areaToTest.x;x < this.world.areas[y].length;x++){
			const area = this.world.areas[y][x]
			if(area && !area.manageTurns()){
				this.pausedArea = area
				break loop1
			}
			else this.pausedArea = null
		}}

		canvas.renderer.clear()
		this.currentArea.drawTiles()
		this.currentArea.entities.forEach(entity => canvas.drawImage(entity))
		this.currentArea.projectiles.forEach(projectile => {
			projectile.animate()
			canvas.drawImage(projectile)
		})

		for(const effectGroup in this.currentArea.effects){
			this.currentArea.effects[effectGroup].objects.forEach(effect => {
				if(effect.active){
					effect.animate()
					effect.draw()
				}
			})
		}
		canvas.drawUI(this.userInterfaces)
	}
}





window.loader = new Loader
loader.loadWorld([
	'player.tsx',
	'goblin.tsx',
	'militia.tsx',
	'targetMark.tsx',
	'potato.tsx',
	'goblinRanged.tsx',
	'thrownRock.tsx'
])
.then((result) => {
	window.game = new Game

	for(let y = 0; y < result[0].areas.length;y++){
	for(let x = 0; x < result[0].areas[y].length;x++){
		if(result[0].areas[y][x]){
			result[0].areas[y][x] = new Area(result[0].areas[y][x])
		}
	}}
	game.world = result[0]

	window.canvas = new Canvas
	window.input = new Input(canvas.renderer.c)
	window.pathfinder = new Pathfinder

	window.dialogBox = new DialogBox
	window.inventoryInteface = new Inventory


	game.currentArea = game.world.areas[1][1]

	new Entities.Player(5,7)

	for(let y = 0; y < game.world.areas.length;y++){
	for(let x = 0; x < game.world.areas[y].length;x++){
		const area = game.world.areas[y][x]
		if(area){
			const quantity = randomInt(10,20)

			for(let i = 0; i < quantity; i++){
				const value = randomInt(0,3)
				const randomX = randomInt(0,area.size.x-1)
				const randomY = randomInt(0,area.size.y-1)

				if(value === 0) new Entities.Goblin(randomX,randomY,area)
				// if(value === 1) new Entities.GoblinRanged(randomX,randomY,area)
				if(value === 2) new Items.Potato(randomX,randomY,area)
				if(value === 3) new Entities.Militia(randomX,randomY,area)
			}
		}
	}}

	game.running = true
	game.tick()
})





/* A Fazer
2. Terminar o Inventario:
 - Os itens tem que ter o tamanho correto;
 - Arrastar itens para trocar sua posisão;
 - Alguma maneira de droppar itens.
3. Ataques a distancia:
 - Armas de projeteis, primitivas e modernas;
 - Magias(?).
 - Em area, linha reta, etc...
4. Mapa(ou minimapa)
*/