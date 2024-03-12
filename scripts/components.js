import {Vector2D} from './geometry.js'

export class Component{
	constructor(config,parent){
		this.config = config
		this.parent = parent ? parent : {width:game.resolution.x,height:game.resolution.y,opacity:1,pos: new Vector2D}

		this.children = []
		if(parent) this.parent.children.push(this)

		if(Array.isArray(config.pos)){
			this.config.pos = {
				x: config.pos[0],
				y: config.pos[1]
			}
		}
		else this.config.pos = new Vector2D(this.config.pos)

		this.pos = new Vector2D(this.config.pos)

		this.width = config.width ? config.width : config.image ? config.image.width : 0
		this.height = config.height ? config.height : config.image ? config.image.height : 0	
		
		this.ratio = config.ratio ? config.ratio : null
		this.radian = config.radian ? config.radian : 0
		this.origin = config.origin ? new Vector2D(config.origin) : new Vector2D(0.5)

		if(typeof this.width === 'string') this.width = this.parent.width * (parseFloat(this.width)/100)
		if(typeof this.height === 'string') this.height = this.parent.height * (parseFloat(this.height)/100)

		if(this.ratio){
			this.width = this.width === 0 ? this.height * this.ratio : this.width
			this.height = this.height === 0 ? this.width * this.ratio : this.height
		} 

		if(typeof this.config.pos.x === 'string'){
			if(this.config.pos.x === 'center'){
				this.pos.x = this.parent.width / 2 - this.width + this.parent.pos.x
			}
			else this.pos.x = this.parent.pos.x * (parseFloat(this.config.pos.x)/100)
		}
		else this.pos.x += this.parent.pos.x

		if(typeof this.config.pos.y === 'string'){
			if(this.config.pos.y === 'center'){
				this.pos.y = this.parent.height / 2 - this.height + this.parent.pos.y
			}
			else this.pos.y = this.parent.pos.y * (parseFloat(this.config.pos.y)/100)
		}
		else this.pos.y += this.parent.pos.y

		this.visible = config.visible === undefined ? true : config.opacity
		this.opacity = config.opacity === undefined ? 1 : config.opacity
		this.fill = config.fill ? config.fill : null
		this.stroke = config.stroke ? config.stroke : null
		this.strokeWidth = config.strokeWidth ? config.strokeWidth : 1

		this.image = config.image ? config.image : null
		this.imageDes = config.imageDes ? config.imageDes : new Vector2D 
		this.imageDesSize = config.imageDesSize || !this.image ? config.imageDesSize : new Vector2D(this.image.width,this.image.height)
		this.imageSor = config.imageSor ? config.imageSor : new Vector2D

		this.imageSorSize = this.image ? new Vector2D(this.image.width,this.image.height) : new Vector2D
		this.imageSorSize = config.imageSorSize ? config.imageSorSize : this.imageSorSize

		this.text = config.text ? config.text : null
		this.font = config.font ? config.font : "16px serif"
		this.textFill = config.textFill ? config.textFill : '#000'
		this.textStroke = config.textStroke ? config.textStroke : null

		this.lineSpacing = config.lineSpacing ? config.lineSpacing : 1.2
		this.textBaseline = config.textBaseline ? config.textBaseline : 'alphabetic'
		this.textAlign = config.textAlign ? config.textAlign : 'start'

		this.textPosAligment = config.textPosAligment ? config.textPosAligment : null
		this.textHorizontalAligment = null 
		this.textVerticalAligment = null
		
		this.textPos = new Vector2D(config.textPos)

		if(config.onHover) this.onHover = config.onHover
		if(config.onClick) this.onClick = config.onClick
		this.hovered = false
		this.clicked = false

		this.resizebleByText = config.resizebleByText !== undefined ? config.resizebleByText : false
	}
	isPointInside(point){
		return point.x > this.pos.x
		&& point.x < this.pos.x + this.width
		&& point.y > this.pos.y
		&& point.y < this.pos.y + this.height
	}
	checkPointerEvents(event){
		if(this.opacity > 0 && this.visible){
			const pointerIn = this.isPointInside(event.pointer)
			this.hovered = pointerIn
			this.clicked = pointerIn

			if(this.onHover) this.onHover()
			if(this.onClick) this.onClick(event)
			this.children.forEach(child => child.checkPointerEvents(event))
		}
	}
	recaulculatePosition(){
		if(this.config.pos){
			if(typeof this.config.pos.x === 'number') this.pos.x = this.config.pos.x + this.parent.pos.x
			
			else if(typeof this.config.pos.x === 'string'){
				if(this.config.pos.x === 'center') this.pos.x = this.parent.width / 2 - this.width + this.parent.pos.x
				else this.pos.x = this.parent.pos.x * (parseFloat(this.config.pos.x)/100)	
			}

			if(typeof this.config.pos.y === 'number') this.pos.y = this.config.pos.y + this.parent.pos.y
			
			else if(typeof this.config.pos.y === 'string'){
				if(this.config.pos.y === 'center') this.pos.y = this.parent.height / 2 - this.height + this.parent.pos.y
				else this.pos.y = this.parent.pos.y * (parseFloat(this.config.pos.y)/100)		
			}
		}
		else this.pos.set(this.parent.pos)

		if(typeof this.config.width === 'string') this.width = this.parent.width * (parseFloat(this.config.width)/100)
		if(typeof this.config.height === 'string') this.height = this.parent.height * (parseFloat(this.config.height)/100)
	}
	resize(){
		this.recaulculatePosition()
		this.children.forEach(child => child.resize())
	}
	appendChild(child){
		new Component(child.config,this)
	}
	createChild(config,optionalName){
		if(optionalName){
			return this[optionalName] = new Component(config,this)	
		}
		else return new Component(config,this)
	}
	updateChildren(){
		this.children.forEach(child => {
			child.recaulculatePosition()
			child.updateChildren()
		})
	}
	measureText(){
		const ctx = document.createElement('canvas').getContext('2d')
		ctx.font = this.font
		ctx.textBaseline = this.textBaseline
		return ctx.measureText(this.text)
	}
}