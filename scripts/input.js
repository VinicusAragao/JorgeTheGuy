import {Vector2D} from './geometry.js'

export class Input{
	constructor(selectedTarget){
		this.target = selectedTarget
		this.targetBox = this.target.getBoundingClientRect()
		this.keys = []
		this.mouse = [false,false,false,false,false]
		this.pointer = new Vector2D

		const target = this.target ? this.target : window
		target.addEventListener('pointerdown', e => {
			this.getPointer(e)
			this.mouse[e.button] = true
		})
		target.addEventListener('pointermove', e => {
			this.getPointer(e)
		})

		target.addEventListener('pointerup', e => {
			this.getPointer(e)
			this.mouse[e.button] = false

			if(e.button === 0 && !game.interfaceOpen){
				const cell = Vector2D.div(this.pointer,new Vector2D(64)).roundDown()
				if(game.currentArea.isValidCell(cell)){
					game.player.targetTile = game.currentArea.getTile(cell)
				}
			}
		})
		window.addEventListener('keydown', e => this.getKey(e))
		window.addEventListener('keyup', e => this.getKey(e))
		window.addEventListener('resize', e => this.targetBox = this.target.getBoundingClientRect())
	}
	getPointer(e){
		this.pointer.set(e.clientX,e.clientY).sub(new Vector2D(this.targetBox.x,this.targetBox.y))
	}
	getKey(e){
		this.keys[e.key] = e.type === 'keydown'

		if(e.type !== 'keyup') return
		switch(e.key){
		case '+':
		case 'r': 
			inventoryInterface.toggle()
		break
		case 'h': 
			game.saveProgress()
		break
		case '*': 
			console.log("Sorry! Targeting doesn't work like that here ;(")
		break
		case 'g': 
			game.drawGrid = !game.drawGrid
		}
	}
}