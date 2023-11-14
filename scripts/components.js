import {Vector2D} from './geometry.js'

export class UserInterface{
	constructor(config){
		this.config = config
		this.parent = {opacity:1}
		this.children = []

		this.pos = config.pos ? new Vector2D(config.pos[0],config.pos[1]) : new Vector2D
		this.width = config.width ? config.width : 250
		this.height = config.height ? config.height : 250

		this.visible = config.visible ? config.visible : true
		this.opacity = typeof config.opacity !== 'undefined' ? config.opacity : 1
		this.fill = config.fill ? config.fill : null
		this.stroke = config.stroke ? config.stroke : null
		this.strokeWidth = config.strokeWidth ? config.strokeWidth : 1
		this.image = config.image ? config.image : null

		this.onHover = config.onHover ? config.onHover : null
		this.onClick = config.onClick ? config.onClick : null
		game.userInterfaces.push(this)
	}
	checkPointerEvents(point,clicked){
		this.children.forEach(child => {
			child.checkPointerEvents(point,clicked)
		})
		if(this.isPointInside(point)){
			if(this.onHover) this.onHover(true)
			return true
		}
		if(this.onHover) this.onHover(false)
		return false
	}
	isPointInside(point){
		return point.x > this.pos.x
		&& point.x < this.pos.x + this.width
		&& point.y > this.pos.y
		&& point.y < this.pos.y + this.height
	}
	resize(){
		if(typeof this.config.pos.x === 'string') this.pos.x = this.parent.pos.x * (parseFloat(this.config.pos.x)/100)
		if(typeof this.config.pos.y === 'string') this.pos.y = this.parent.pos.y * (parseFloat(this.config.pos.y)/100)
		if(typeof this.config.width === 'string') this.width = this.parent.width * (parseFloat(this.config.width)/100)
		if(typeof this.config.height === 'string') this.height = this.parent.height * (parseFloat(this.config.height)/100)
		this.children.forEach(child => child.resize())
	}
}

export class Component{
	constructor(config,parent){
		this.config = config
		this.parent = parent ? parent : new UserInterface({})

		this.parent.children.push(this)
		this.children = []

		this.positionType = config.positionType ? config.positionType : 'relative'

		if(config.pos) this.pos = new Vector2D(config.pos[0],config.pos[1])
		else this.pos = new Vector2D
		this.width = config.width ? config.width : 0
		this.height = config.height ? config.height : 0
		this.ratio = config.ratio ? config.ratio : null

		if(this.positionType === 'relative'){
			if(typeof this.pos.x === 'string') this.pos.x = this.parent.pos.x * (parseFloat(this.pos.x)/100)
			else this.pos.x += this.parent.pos.x

			if(typeof this.pos.y === 'string') this.pos.y = this.parent.pos.y * (parseFloat(this.pos.y)/100)
			else this.pos.y += this.parent.pos.y

			if(typeof this.width === 'string') this.width = this.parent.width * (parseFloat(this.width)/100)

			if(typeof this.height === 'string') this.height = this.parent.height * (parseFloat(this.height)/100)
			
			this.width = Math.min(this.width,this.parent.width)
			this.height = Math.min(this.height,this.parent.height)
		}

		if(this.ratio){
			this.width = this.width === 0 ? this.height * this.ratio : this.width
			this.height = this.height === 0 ? this.width * this.ratio : this.height
		}

		this.visible = config.visible ? config.visible : true
		this.opacity = config.opacity ? config.opacity : 1
		this.fill = config.fill ? config.fill : null
		this.stroke = config.stroke ? config.stroke : null
		this.strokeWidth = config.strokeWidth ? config.strokeWidth : 1
		this.image = config.image ? config.image : null

		this.text = config.text ? config.text : null
		this.font = "16px serif"
		this.textFill = config.textFill ? config.textFill : '#000'
		this.textStroke = config.textStroke ? config.textStroke : null

		this.lineSpacing = config.lineSpacing ? config.lineSpacing : 1.2
		this.textBaseline = config.textBaseline ? config.textBaseline : 'alphabetic'
		this.textAlign = config.textAlign ? config.textAlign : 'start'
		this.textPosAligment = config.textPosAligment ? config.textPosAligment : null
		this.textHorizontalAligment = null 
		this.textVerticalAligment = null
		this.textPos = new Vector2D

		if(config.textPos) this.textPos.set(config.textPos[0],config.textPos[1])
		else if(this.textPosAligment){
			if(typeof this.textPosAligment === 'object'){
				this.textHorizontalAligment = this.textPosAligment[0] ? this.textPosAligment[0] : null
				this.textVerticalAligment = this.textPosAligment[1] ? this.textPosAligment[1] : null
			}
			else{
				this.textHorizontalAligment = this.textPosAligment
				this.textVerticalAligment = this.textPosAligment
			}

			if(this.textHorizontalAligment === 'center'){
				this.textPos.x = this.width ?  this.width/2 : this.parent.width/2
			}
			if(this.textVerticalAligment === 'center'){
				this.textPos.y = this.height ?  this.height/2 : this.parent.height/2
				this.textBaseline = 'middle'
			}
			this.textPos.add(this.pos)
		}
		else{
			this.textPos = new Vector2D(this.pos)
		}

		this.onHover = config.onHover ? config.onHover : null
		this.onClick = config.onClick ? config.onClick : null
		this.hovered = false
		this.clicked = false
	}
	isPointInside(point){
		return point.x > this.pos.x
		&& point.x < this.pos.x + this.width
		&& point.y > this.pos.y
		&& point.y < this.pos.y + this.height
	}
	checkPointerEvents(point,clicked){
		if(this.onHover || this.onClick){
			if(this.isPointInside(point)){
				if(this.onHover){
					this.onHover(true)
					this.hovered = true
				}
				if(this.onClick){
					this.onClick(clicked)
					this.clicked = !this.clicked
				}
			}
			else if(this.onHover){
				this.onHover(false)
				this.hovered = false
			}
		}
		this.children.forEach(child => {
			child.checkPointerEvents(point,clicked)
		})
	}
	resizePercentageValues(){
		if(typeof this.config.pos.x === 'string') this.pos.x = this.parent.pos.x * (parseFloat(this.config.pos.x)/100)
		if(typeof this.config.pos.y === 'string') this.pos.y = this.parent.pos.y * (parseFloat(this.config.pos.y)/100)
		if(typeof this.config.width === 'string') this.width = this.parent.width * (parseFloat(this.config.width)/100)
		if(typeof this.config.height === 'string') this.height = this.parent.height * (parseFloat(this.config.height)/100)
	}
	resize(){
		this.resizePercentageValues()
		this.children.forEach(child => child.resize())
	}
}