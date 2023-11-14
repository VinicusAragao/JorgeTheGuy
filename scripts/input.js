import {Vector2D} from './geometry.js'
export class Input{
	constructor(selectedTarget){
		this.target = selectedTarget
		this.keys = []
		this.recentkeys = []
		this.mouse = [false,false,false,false,false]
		this.pointer = new Vector2D

		const target = this.target ? this.target : window
		target.addEventListener('pointerdown',(e)=>{
			this.getPointer(e)
			this.mouse[e.button] = true
			this.checkUserInteraction()
		})
		target.addEventListener('pointermove',(e)=>{
			this.getPointer(e)
			this.checkUserInteraction()
		})
		target.addEventListener('pointerup',(e)=>{
			this.getPointer(e)
			this.mouse[e.button] = false
			this.checkUserInteraction()
		})
		window.addEventListener('keydown',(e)=>{
			this.getKey(e)
		})
		window.addEventListener('keyup',(e)=>{
			this.getKey(e)
		})
	}
	getPointer(e){
		this.pointer.set(e.clientX,e.clientY)
		if(this.target){
			const box = this.target.getBoundingClientRect()
			this.pointer.sub(new Vector2D(box.x,box.y))
		}
	}
	getKey(e){
		this.recentkeys.push(e.key)
		this.keys[e.key] = e.type === 'keydown'
	}
	checkUserInteraction(){
		let interactedWithInterface = false
		game.userInterfaces.forEach(userInterface => {
			if(userInterface.checkPointerEvents(this.pointer,this.mouse[0]))
				interactedWithInterface = true
		})
	}
}