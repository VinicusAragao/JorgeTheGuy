import {UserInterface,Component} from './components.js'

export class DialogBox extends UserInterface{
	constructor(){
		const margin = 20
		super({
			pos: [(canvas.width - 800)/2,canvas.height - 200 - margin],
			width: 800,
			height: 200,
			fill: '#111',
			stroke: '#fff',
			strokeWidth: 5,
			opacity: 0,
		})	
		new Component({
			fill: '#222',
			pos: [20,20],
			textPos: [10,10],
			width: 800 - 40,
			height: 160,
			text: '',
			textFill: '#fff',
			textBaseline: 'top',
			lineSpacing: 1.4,
		},this)
		this.textAnimationTimeout = 0
		this.textSpeed = 1.5 * game.targetFrameRate
		this.totalText = ''
		this.textIndex = 0 
	}
	animateText(){
		const char = this.totalText[this.textIndex]
		let nextCharSpeed = this.textSpeed

		switch(char){
		case ' ': nextCharSpeed *= 1.5 ; break
		case ',': nextCharSpeed *= 4 ; break
		case '.': 
		case '!': 
		case '?': nextCharSpeed *= 8
		} 
		this.children[0].text += char
		this.textIndex++

		if(this.textIndex < this.totalText.length){
			this.textAnimationTimeout = setTimeout(()=>this.animateText(),nextCharSpeed)
		}
	}
	setText(text){
		this.textIndex = 0
		this.totalText = text
		this.children[0].text = ''
		clearTimeout(this.textAnimationTimeout)

		this.textAnimationTimeout = setTimeout(()=>this.animateText(),this.textSpeed)
	}
	activate(){
		this.opacity = 1
	}
	deactivate(){
		this.opacity = 0
		this.setText(' ')
	}
}

export class Inventory extends UserInterface{
	constructor(){
		const width = 600
		const height = 400

		super({
			pos: [(canvas.width - width)/2,canvas.height/2 - height/2],
			width: width,
			height: height,
			fill: '#333',
			stroke: '#000',
			strokeWidth: 2,
			opacity: 0,
		})
		const rows = 12
		const cols = 12
		const squareSize = 30
		const inventorySquares = new Component({
			pos: [5,5],
			width: squareSize * cols + cols,
			height: squareSize * rows + rows,
			stroke: '#000'
		},this)
		for(let y = 0; y < rows;y++){
		for(let x = 0; x < cols;x++){
			new Component({
				pos: [squareSize * x + x,squareSize * y + y],
				width: squareSize,
				ratio: 1/1,
				stroke: '#000',
				fill: '#222',
				onHover: function (bool){
					if(bool){
						this.fill = '#999'
					}
					else{
						this.fill = '#222'
					}
				}
			},inventorySquares)
		}}
		this.items = []
		this.active = false
	}
	toggle(){
		if(this.active) this.deactivate()
		else this.activate()
	}
	activate(){
		this.opacity = 1
		this.active = true
	}
	deactivate(){
		this.opacity = 0
		this.active = false
	}
}