import {Input} from './scripts/input.js'
import {Canvas} from './scripts/canvas.js'
import {Loader} from './scripts/loader.js'
import {Vector2D} from './scripts/geometry.js'
import {Pathfinder} from './scripts/pathfinding.js'
import {
	DialogBox,
	Inventory
} from './scripts/interface.js'

import * as Entities from './scripts/entities.js'

Array.prototype.findAndRemove = function (item){
	for(let i = 0; i < this.length;i++){
		if(item === this[i]){
			this.splice(i,1)
		}
	}
}
class Game{
	constructor(){
		this.resolution = new Vector2D(1280,736)

		this.desiredFPS = 60
		this.targetFrameRate = 1000 / this.desiredFPS
		this.deltaTime = 1
		this.lastTimeMeasure = performance.now()
		this.running = false
		this.animationRequest = 0

		this.entities = []
		this.userInterfaces = []
		this.player = null

		this.targetMarks = new Array(20)
	
		this.timerDuration = this.targetFrameRate
		this.timer = this.moveCooldownDuration
		this.turn = 0

		this.collisionMap = null
	}
	activateTargetMark(cell){		
		this.targetMarks.forEach(mark => {
			if(!mark.active){
				mark.setCell(cell)
				return 
			}
		})
	}
	changeStage(cell){
		const actualX = canvas.stage.x
		const actualY = canvas.stage.y

		if(cell.x === -1){
			const newStage = this.world.stages[actualY][actualX-1] 
			if(newStage){
				canvas.setStage(newStage)
				return new Vector2D(canvas.size.x-1,cell.y)
			}
		}
		if(cell.y === -1){
			if(this.world.stages[actualY-1]){
				const newStage = this.world.stages[actualY-1][actualX] 
				if(newStage){
					canvas.setStage(newStage)
					return new Vector2D(cell.x,canvas.size.y-1)
				}
			}
		}
		if(cell.x === canvas.size.x){
			const newStage = this.world.stages[actualY][actualX+1] 
			if(newStage){
				canvas.setStage(newStage)
				return new Vector2D(0,cell.y)
			}
		}
		if(cell.y === canvas.size.y){
			if(this.world.stages[actualY+1]){
				const newStage = this.world.stages[actualY+1][actualX] 
				if(newStage){
					canvas.setStage(newStage)
					return new Vector2D(cell.x,0)
				}
			}
		}
	}
	updateCollisionMap(){
		if(!this.collisionMap){
			this.collisionMap = []
			for(let y = 0; y < canvas.stage.layers[0].tiles.length;y++){
				this.collisionMap[y] = []
				for(let x = 0; x < canvas.stage.layers[0].tiles[y].length;x++){
					this.collisionMap[y][x] = true
				}
			}
		}
		else{
			for(let y = 0; y < this.collisionMap.length;y++){
			for(let x = 0; x < this.collisionMap[y].length;x++){
				this.collisionMap[y][x] = true
			}}
		}
		this.entities.forEach(entity => {
			this.collisionMap[entity.cell.y][entity.cell.x] = false
		})
	}
	manageTurns(){
		if(this.turn === 0){
			this.attackedTiles = []
		}
		for(let i = 0; i < this.entities.length;i++){
			const entity = this.entities[this.turn]

			if(entity.constructor.name === 'Player'){
				if(this.timer > 0){
					this.timer--
					break
				}
				else if(entity.move()){
					this.timer = this.timerDuration
					this.passTurn()
					game.updateCollisionMap()
				}
			}
			else{
				entity.move()
				this.passTurn()
				game.updateCollisionMap()
			}
		}
	}
	passTurn(){
		this.turn++
		if(this.turn >= this.entities.length){
			this.turn = 0
		}
	}
	isOccupied(cell){
		return this.collisionMap[cell.y][cell.x]
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
		this.manageTurns()

		canvas.renderer.clear()
		canvas.drawTiles()
		this.targetMarks.forEach(mark => {
			if(mark.active){
				if(mark.animate()) canvas.renderer.drawImage(mark)
			}
		})
		this.entities.forEach(entity => canvas.renderer.drawImage(entity))
		canvas.drawUI(this.userInterfaces)
	}
}
window.loader = new Loader

loader.loadWorld([
	'player.tsx',
	'goblin.tsx',
	'militia.tsx',
	'targetMark.tsx',
])
.then((result) => {
	window.game = new Game

	for(let i = 0; i < game.targetMarks.length;i++){
		game.targetMarks[i] = new Entities.TargetMark
	}

	game.world = result[0]
	window.canvas = new Canvas
	window.input = new Input(canvas.renderer.c)

	window.dialogBox = new DialogBox
	window.inventoryInteface = new Inventory

	window.pathfinder = new Pathfinder
	
	const currentStage = new Vector2D(2,0)
	canvas.setStage(currentStage,result[1])
	game.updateCollisionMap()

	new Entities.Player(new Vector2D(7,2))

	for(let y = 0; y < 2;y++){
	for(let x = 0; x < 10;x++){
		new Entities.Goblin(new Vector2D(x,y))
	}}
	for(let y = 0; y < 2;y++){
		new Entities.Militia(new Vector2D(12,y))
	}
	
	game.updateCollisionMap()

	game.running = true
	game.tick()
})
