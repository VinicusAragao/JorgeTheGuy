import {Component} from './components.js'
import {Vector2D} from './geometry.js'

export class DialogBox extends Component{
	constructor(){
		const margin = 15
		const width = 540
		const height = 100

		super({
			pos: [(canvas.width - width)/2,(canvas.height - height) - 30],
			width: width,
			height: height,
			fill: '#340c03',
			stroke: '#000',
			visible: false,
		})
		this.createChild({
			fill: '#240000',
			pos: [20,0],
			width: width/4,
			height: margin*2,
			font: '18px serif',
			textPos: [margin*2,2],
			textFill: '#fff',
			textBaseline: 'top'
		},'characterName')
		this.createChild({
			fill: '#621909',
			stroke: '#000',
			pos: [margin*1.5,margin*1.5],
			textPos: [10,10],
			width: 800,
			height: 200,
			textFill: '#fff',
			textBaseline: 'top',
			lineSpacing: 1.4,
		},'textDisplay')
		
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
		this.textDisplay.text += char
		this.textIndex++

		if(this.textIndex < this.totalText.length){
			this.textAnimationTimeout = setTimeout(()=>this.animateText(),nextCharSpeed)
		}
	}
	setText(text){		
		this.textIndex = 0
		this.totalText = text
		this.textDisplay.text = ''
		clearTimeout(this.textAnimationTimeout)

		this.textAnimationTimeout = setTimeout(()=>this.animateText(),this.textSpeed)
	}
	activate(name){
		this.characterName.text = name
		this.visible = true
		game.interfaceOpen = true
	}
	deactivate(){
		this.visible = false
		this.setText(' ',' ')
		game.interfaceOpen = false
	}
}

export class Inventory extends Component{
	static width = 12 * 40
	static height = 12 * 40

	constructor(){
		super({
			pos: [(canvas.width - Inventory.width)/2,canvas.height/2 - Inventory.height/2],
			width: Inventory.width,
			height: Inventory.height,
			fill: '#621909',
			stroke: '#340c03',
			strokeWidth: 16,
			visible: false,
		})

		this.rows = 12
		this.cols = 12

		this.items = []
		this.cells = []

		this.grabbedItem = null
		this.user = null

		this.cells = []

		for(let y = 0; y < this.rows;y++){
			this.cells.push([])
			for(let x = 0; x < this.cols;x++){
				this.cells[y].push(new InventoryCell(x,y,this))
			}
		}

		this.toolTip = new ItemToolTip(this)
	}
	toggle(){
		if(this.visible){
			this.visible = false
			game.interfaceOpen = false
		}
		else if(!game.interfaceOpen){
			this.visible = true
			this.toolTip.visible = false
			game.interfaceOpen = true
		}
	}
	addItem(item){
		const data = item.data ? item.data : item.storeData()
		const freeCells = this.getCellsForItem(data.cellSize)
		if(!freeCells) return
		new ItemDisplay(data,freeCells,this)
	}
	removeItem(item){
		this.items.findAndRemove(item)
		this.children.findAndRemove(item)
		item.setCells()
	}
	useItem(item){
		const convertedItem = game.convertDisplayItem(item)
		switch(convertedItem.category){
			case 'healing': 
				this.user.regenerateLifePoints(convertedItem.damage)
				this.removeItem(item)
				this.toolTip.toggle()
				break 
			case 'weapon': 
				this.user.weapon.unEquip()
				convertedItem.equip(this.user)
			break
		}
	}
	getCellsForItem(size,start){
		const startingCell = start ? start : new Vector2D
		const max = new Vector2D(size).sub(1)
		let cells = []
		for(let y1 = startingCell.y; y1 < this.cols; y1++){
		returnLoop: 
		for(let x1 = startingCell.x; x1 < this.rows; x1++){
			for(let y2 = 0; y2 <= max.y; y2++){
			for(let x2 = 0; x2 <= max.x; x2++){
				const newY = y1+y2
				const newX = x1+x2
				if(newY >= this.cols || newX >= this.rows){
					continue returnLoop
				}

				const cell = this.cells[newY][newX]
				if(cell.item && cell.item !== this.grabbedItem){
					cells = []
					continue returnLoop
				}
				cells.push(cell)
			}}
			return cells
		}}
		return false
	}
	dropItem(item){
		this.removeItem(item)
		game.convertDisplayItem(item.data).drop(this.user.cell)
	}
}
class ItemToolTip extends Component{
	static width = 200
	static height = 200
	constructor(parent){
		super({
			visible: false,
			width: ItemToolTip.width,
			height: ItemToolTip.height,
			stroke: '#000',
			strokeWidth: 2,
			fill: '#222'
		},parent)

		this.createChild({
			width: this.width,
			height: 20, 
			textPos: new Vector2D(this.width/2,15),
			textAlign: 'center',
			textFill: '#fff',
			font: '18px serif'
		},'nameDisplay')

		this.createChild({
			width: this.width,
			textBaseline: 'top',
			textFill: '#999',
			font: '10px serif',
			fill: '#333',
			resizebleByText: true,
			textPos: new Vector2D(8,8),
		},'descriptionDisplay')

		this.createChild({
			width: this.width,
			textBaseline: 'top',
			textFill: '#fff',
			font: '12px serif',
			textAlign: 'center',
			textPos: new Vector2D(this.width/2,8),
			resizebleByText: true,
		},'effectDisplay')

		this.createChild({
			width: 100,
			height: 14,
			fill: '#333',
			font: '12px serif',
			textFill: '#fff',
			stroke: '#000',
			strokeWidth: 1,
			textAlign: 'center',
			textBaseline: 'top',
			textPos: new Vector2D(50,0),
			pos: new Vector2D(this.width/4,0),
			onHover: function(){
				if(this.hovered){
					canvas.changeCursor('pointer')
					this.fill = '#000'
				}
				else{
					this.fill = '#333'
				}
			},
			onClick: function(event){
				if(this.hovered && event.buttons[0]){
					this.fill = '#fff'
					this.textFill = '#000'
					window.inventoryInterface.useItem(this.parent.item)
				}
			}
		},'button')
		this.item = null
	}
	onHover(){
		if(this.hovered) canvas.changeCursor()
	}
	toggle(item){
		if(item){
			this.visible = true
			this.describeItem(item)
		}
		else{
			this.visible = false
			this.item = null
		}
	}
	describeItem(item){
		this.item = item
		this.pos.set(item.cells[0].pos).add(item.data.cellSize.x * item.cells[0].width,0)

		this.updateChildren()

		this.nameDisplay.text = item.data.name
		switch(item.data.category){
		case 'weapon': 
			this.nameDisplay.fill = '#f00'
			this.effectDisplay.text = `- ${item.data.damage} de dano;/n- ${item.data.range} de alcance;/n- ${item.data.strength} de força;/n- ${item.data.cooldown} turnos para recarga.`
			this.button.text = 'Equipar'
			break
		case 'healing': 
			this.nameDisplay.fill = '#0f0'
			this.effectDisplay.text = ` - Recupera ${item.data.damage} pontos de vida.`
			this.button.text = 'Usar'
			break
		default: 
			this.nameDisplay.fill = '#999'
		}
		
		this.descriptionDisplay.text = item.data.description
		this.descriptionDisplay.pos.y = this.pos.y + this.nameDisplay.height

		this.effectDisplay.pos.y = this.descriptionDisplay.height + this.descriptionDisplay.pos.y

		this.button.pos.y = this.effectDisplay.pos.y + this.effectDisplay.height + 8

		this.height = this.button.pos.y - this.pos.y + this.button.height + 8
	}
}
class InventoryCell extends Component{
	constructor(x,y,parent){
		super({
			pos: [40 * x,40 * y],
			width: 40,
			ratio: 1/1,
			stroke: '#8a5922',
			fill: '#98652c',
		},parent)

		this.cell = new Vector2D(x,y)
		this.item = null
	}
	onHover(){
		if(this.hovered){
			this.fill = '#a77135'
			if(this.item){
				this.item.cells.forEach(cell => cell.fill = '#a77135')
				canvas.changeCursor('pointer')
				if(!this.parent.grabbedItem){
					this.parent.toolTip.toggle(this.item)
				}
			}
		}		
		else{
			this.fill = '#98652c'
		}
	}
	onClick(event){
		if(!this.hovered) return
		if(event.buttons[2] && this.item){
			this.parent.dropItem(this.item)
			this.parent.toolTip.toggle()
		}
		if(event.buttons[0]){
			if(this.item && !this.parent.grabbedItem){
				this.parent.grabbedItem = this.item
				this.parent.toolTip.toggle()
			}
		}
		else if(!this.item && this.parent.grabbedItem){
			const cells = this.parent.getCellsForItem(this.parent.grabbedItem.data.cellSize,this.cell)
			if(cells.length > 0){
				this.parent.grabbedItem.setCells(cells)
				this.parent.grabbedItem = null
				canvas.changeCursor()
			}
		}
		else if(this.item !== null && this.item === this.parent.grabbedItem){
			this.parent.grabbedItem = null
			this.item.getCentered()
		}
	}
}
class ItemDisplay extends Component{
	constructor(item,cells,parent){
		const totalCellSize = Vector2D.mult(item.cellSize,40)
		const proportion = item.image.width / item.image.height
		let imageSize = new Vector2D(totalCellSize).sub(2)

		if(item.image.width > item.image.height) imageSize.y = Math.floor(imageSize.x / proportion)
		if(item.image.height > item.image.width) imageSize.x = Math.floor(imageSize.y * proportion)
		
		const topLeftPos = Vector2D.mult(cells[0].cell,40)
		const freeSpace = Vector2D.sub(totalCellSize,imageSize).div(2)
		const finalPos = Vector2D.add(topLeftPos,freeSpace)

		super({
			pos: finalPos,
			width: imageSize.x,
			height: imageSize.y,
			image: item.image,
			imageDesSize: imageSize,
		},parent)

		this.freeSpace = new Vector2D(freeSpace)
		this.imageSize = new Vector2D(imageSize)

		this.data = item
		this.cells = []
		this.setCells(cells)
		this.parent.items.push(this)
	}
	onHover(){
		if(this.parent.grabbedItem === this){
			canvas.changeCursor('grab')
			this.followPointer()
		}
	}
	followPointer(){
		this.pos.set(Vector2D.sub(input.pointer,Vector2D.div(this.imageSize,2)))
	}
	getCentered(){
		this.pos.set(
			Vector2D.mult(this.cells[0].cell,40).add(this.freeSpace)
		).add(this.parent.pos)
	}
	setCells(newCells){
		this.cells.forEach(oldCell => oldCell.item = null)
		if(newCells){
			newCells.forEach(newCell => newCell.item = this)
			this.cells = newCells	
			this.getCentered()
		}
		else this.cells = []
	}
}