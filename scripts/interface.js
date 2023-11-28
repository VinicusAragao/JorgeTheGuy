import {UserInterface,Component} from './components.js'
import {Vector2D} from './geometry.js'

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
		this.pannel = new InventoryPannel(this)
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
	addItem(item){
		this.pannel.addItem(item)
	}
}
class InventoryPannel extends Component{
	constructor(parent){
		const rows = 12
		const cols = 12
		const squareSize = 30

		const width = squareSize * cols
		const height = squareSize * rows
		super({
			pos: [5,parent.height/2 - height/2],
			width: width,
			height: height,
			stroke: '#000'
		},parent)

		this.rows = rows
		this.cols = cols
		this.cells = []
		this.grabbedItem = null
		
		for(let y = 0; y < rows;y++){
			this.cells.push([])
			for(let x = 0; x < cols;x++){
				this.cells[y].push(new InventoryCell(x,y,this))
			}
		}
	}
	addItem(item){
		const itemSize = item.inventory.cellSize
		for(let y = 0; y < this.cells.length; y++){
		for(let x = 0; x < this.cells[y].length; x++){
			const initialCell = new Vector2D(x,y)
			const occupiedCells = this.itemCanFit(initialCell,itemSize)
			if(!occupiedCells) continue

			item.cells = occupiedCells
			occupiedCells.forEach(cell => {
				cell.children = []
				new Item(item,Vector2D.sub(cell.cell,initialCell),cell)
			})
			return
		}}
	}
	itemCanFit(cell,size){
		const max = size ? size : new Vector2D
		const cells = []
		for(let y = 0; y <= max.y; y++){
		for(let x = 0; x <= max.x; x++){
			const testedCell = this.cells[cell.y+y][cell.x+x]

			if(testedCell.children[0]) return false
			cells.push(testedCell)
		}}
		return cells
	}
}
class InventoryCell extends Component{
	constructor(x,y,parent){
		const squareSize = 30
		super({
			pos: [squareSize * x,squareSize * y],
			width: squareSize,
			ratio: 1/1,
			stroke: '#000',
			fill: '#222',
			onHover: function(bool){
				if(bool){
					this.fill = '#555'
					if(this.children[0]){
						this.children[0].cells.forEach(cell => {
							cell.fill = '#555'
						})		
					}
					return
				}
				this.fill = '#222'
			},
			onClick: function(bool,e){
				if(bool){
					if(this.parent.grabbedItem && !this.children[0]
					&& e.type === 'pointerup'){
						const cells = this.parent.itemCanFit(this.cell,this.parent.grabbedItem.size)
						if(!cells) return

						this.children[0] = this.parent.grabbedItem
						this.children[0].parent.children = []
						this.children[0].pos.set(
							(this.width - this.children[0].imageDesSize.x)/2 + this.pos.x,
							(this.height - this.children[0].imageDesSize.y)/2 + this.pos.y
						)
						this.children[0].parent = this
						this.children[0].cells = cells
						this.parent.grabbedItem = null
					}	
				}
			}
		},parent)
		this.cell = new Vector2D(x,y)
	}
}
class Item extends Component{
	constructor(item,imageCell,parent){
		const imageCellSize = new Vector2D(
			item.image.width / (item.inventory.cellSize.x + 1),
			item.image.height / (item.inventory.cellSize.y + 1)
		)

		const proportion = item.image.width / item.image.height
		const imageSize = new Vector2D(parent.width,parent.height)

		if(item.image.width > item.image.height) 
			imageSize.y = Math.floor(imageSize.x / proportion)
		else if(item.image.height > item.image.width) 
			imageSize.x = Math.floor(imageSize.y / proportion)

		super({
			pos: [(parent.width - imageSize.x)/2,(parent.height - imageSize.y)/2],
			width: '100%',
			height: '100%',
			image: item.image,
			imageDesSize: imageSize,
			imageSor: Vector2D.mult(imageCellSize,imageCell),
			imageSorSize: imageCellSize,
			onHover: function(e){
				if(this.active){
					this.pos.set(Vector2D.sub(input.pointer,Vector2D.div(this.width,2)))
				}
			},
			onClick: function(bool,e){
				if(bool && e.type === 'pointerdown'){
					this.active = true
					this.parent.parent.grabbedItem = this
					this.pos.set(Vector2D.sub(input.pointer,Vector2D.div(this.width,2)))
					return
				}
				if(this.active && e.type === 'pointerup'){
					this.active = false
					this.pos.set(
						(this.parent.width - this.imageDesSize.x)/2,
						(this.parent.height - this.imageDesSize.y)/2
					)
					this.pos.add(this.parent.pos)
				}
			},
		},parent)
		this.cells = item.cells
	}
} 