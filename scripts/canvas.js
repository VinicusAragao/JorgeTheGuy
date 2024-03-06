import {Vector2D} from './geometry.js'

export class DrawableObject{
	constructor(tileset,cell,area,tileValue){
		this.cell = new Vector2D(cell)
		this.sor = new Vector2D
		this.des = new Vector2D
		
		this.tileset = {}
		this.image = {}
		this.size = new Vector2D

		this.tileValue = tileValue === undefined ? 0 : tileValue
		this.area = area ? area : game.currentArea
		
		this.opacity = 1
		this.radian = 0

		if(tileset){
			this.tileset = tileset
			this.image = this.tileset.image
			this.size = new Vector2D(this.tileset.tilewidth,this.tileset.tileheight)
			
			Object.assign(this,tileset[this.tileValue])
			if(this.animation){
				this.animation = Object.assign({},this.animation) 
			}
		}

		if(cell){
			this.tile = this.area.getTile(this.cell)
			this.des.set(new Vector2D(this.tile.des))
		}

		this.updateTilesetPosition()
	}
	updateTilesetPosition(newValue){
		this.tileValue = newValue !== undefined ? newValue : this.tileValue
		this.sor.set(
			this.size.x * (this.tileValue % this.tileset.columns),
			this.size.y * Math.floor(this.tileValue / this.tileset.columns)
		)
	}
	animate(){
		if(this.animation){
			this.animation.currentDuration += game.targetFrameRate * game.deltaTime
			if(this.animation.currentDuration > this.animation.frames[this.animation.currentFrame].duration){
				this.animation.currentDuration -= this.animation.frames[this.animation.currentFrame].duration
				this.animation.currentFrame++

				if(this.animation.currentFrame >= this.animation.frames.length){
					this.animation.currentFrame = 0
					this.animation.repeatCount++

					if(this.animation.repeatCount > this.animation.timesToReplay){
						this.animation.repeatCount = 0
						return false
					}	
				}
				this.updateTilesetPosition(this.animation.frames[this.animation.currentFrame].tileValue)
			}
		}
		return true
	}
}

export class Canvas{
	constructor(){
		this.c = document.querySelector('canvas')
		this.ctx = this.c.getContext('2d')

		this.transition = {
			direction: new Vector2D,
			position: new Vector2D,
			size: new Vector2D(this.width,this.height)
		}

		this.zoom = 2
		this.resize()

		this.alias = false
		this.fill = '#000'

		this.extraSpace = new Vector2D
		this.screenShakeSpace = new Vector2D
		this.screenShakeQueue = []

		this.c.addEventListener('contextmenu', e => e.preventDefault())
		window.addEventListener('resize', () => this.resize())
	}
	drawTile(tile){
		if(!tile.image) return
		if(tile.animation) tile.animate()
		this.drawImage(tile)
		tile.items.forEach(item => this.drawImage(item))
	}
	drawTransition(){
		if(this.transition.direction.x === 0 && this.transition.direction.y === 0) return
		this.ctx.resetTransform()
		this.ctx.fillStyle = '#000'
		this.ctx.fillRect(this.transition.position.x,this.transition.position.y,this.transition.size.x,this.transition.size.y)
		this.transition.position.add(Vector2D.mult(this.transition.direction,75))
	}
	setTransition(direction){
		this.transition.direction = direction 
		this.transition.position.set(this.extraSpace)
	}
	setScreenShake(power){
		let index = 0

		for(let i = 0; i < this.screenShakeQueue.length;i++){
			if(power === this.screenShakeQueue[i].power){
				this.screenShakeQueue[i].duration = 4
				return
			}
			else if(power < this.screenShakeQueue[i].power){
				index = i + 1 
				continue
			}
			break
		}
		this.screenShakeQueue.splice(index,0,{
			power: power,
			duration: 4
		})
	}
	screenShake(){
		const currentItem = this.screenShakeQueue[0]
		if(!currentItem) return

		switch(currentItem.duration){
			case 4: 
				this.screenShakeSpace.set(0,-currentItem.power)
			break
			case 3: 
				this.screenShakeSpace.set(0,currentItem.power)
			break
			case 2: 
				this.screenShakeSpace.set(-currentItem.power,0)
			break
			case 1: 
				this.screenShakeSpace.set(currentItem.power,0)
			break
			default: 
				this.screenShakeQueue.shift()
		}	
		currentItem.duration--
	}
	changeCursor(cursor){
		this.c.style.cursor = cursor ? cursor : 'default'
	}
	updateSize(size){
		this.width = size.x
		this.height = size.y
		this.c.width = size.x
		this.c.height = size.y

		this.transition.size.set(size)
	}
	drawImage(img){
		this.ctx.imageSmoothingEnabled = this.alias
		this.ctx.globalAlpha = img.opacity
		this.ctx.setTransform(this.zoom,0,0,this.zoom,
			(img.des.x + img.size.x/2) * this.zoom + this.extraSpace.x + this.screenShakeSpace.x,
			(img.des.y + img.size.y/2) * this.zoom + this.extraSpace.y + this.screenShakeSpace.y,
		)
		this.ctx.rotate(img.radian)

		this.ctx.drawImage(
			img.image,
			img.sor.x,img.sor.y,
			img.size.x,img.size.y,
			-img.size.x/2,-img.size.y/2,
			img.size.x,img.size.y,
		)
		this.ctx.resetTransform()
	}
	drawRect(rect){
		this.ctx.setTransform(this.zoom,0,0,this.zoom,
			this.extraSpace.x + this.screenShakeSpace.x,
			this.extraSpace.y + this.screenShakeSpace.y,
		)

		if(rect.fill){
			this.ctx.fillStyle = rect.fill
			this.ctx.fillRect(rect.des.x,rect.des.y,rect.size.x,rect.size.y)
		}
		if(rect.stroke){
			this.ctx.strokeStyle = rect.stroke
			this.ctx.lineWidth = rect.strokeWidth ? rect.strokeWidth : 1
			this.ctx.strokeRect(rect.des.x,rect.des.y,rect.size.x,rect.size.y)
		}
		this.ctx.resetTransform()
	}
	drawGrid(){
		this.ctx.setTransform(this.zoom,0,0,this.zoom,
			this.extraSpace.x + this.screenShakeSpace.x,
			this.extraSpace.y + this.screenShakeSpace.y,
		)

		game.currentArea.layers[0].allTiles.forEach(tile => {
			this.ctx.strokeStyle = tile.stroke
			this.ctx.lineWidth = tile.strokeWidth ? tile.strokeWidth : 1
			this.ctx.strokeRect(tile.des.x,tile.des.y,tile.size.x,tile.size.y)
		})
		this.ctx.resetTransform()
	}
	drawText(text){
		this.ctx.globalAlpha = text.opacity
		this.ctx.setTransform(this.zoom,0,0,this.zoom,
			text.des.x * this.zoom + this.extraSpace.x + this.screenShakeSpace.x,
			text.des.y * this.zoom + this.extraSpace.y + this.screenShakeSpace.y,
		)
		this.ctx.font = text.font
		this.ctx.textAlign = text.textAlign

		if(text.fill){
			this.ctx.fillStyle = text.fill
			this.ctx.fillText(text.value,0,0)
		}
		if(text.stroke){
			this.ctx.strokeStyle = text.stroke
			this.ctx.lineWidth = text.strokeWidth
			this.ctx.strokeText(text.value,0,0)
		}
		this.ctx.resetTransform()
	}	
	drawUI(UIs){
		UIs.forEach(ui => {
			if(!ui.visible || ui.opacity === 0) return
			this.drawComponent(ui)
			this.drawUI(ui.children)
		})
	}
	drawComponent(component){
		this.ctx.setTransform(this.zoom,0,0,this.zoom,
			component.pos.x + this.extraSpace.x + this.screenShakeSpace.x,
			component.pos.y + this.extraSpace.y + this.screenShakeSpace.y
		)
		this.ctx.globalAlpha = Math.min(component.opacity,component.parent.opacity)

		if(component.fill){
			this.ctx.fillStyle = component.fill
			this.ctx.fillRect(0,0,component.width,component.height)
		}
		if(component.stroke){
			this.ctx.strokeStyle = component.stroke
			this.ctx.lineWidth = component.strokeWidth
			this.ctx.strokeRect(0,0,component.width,component.height)
		}
		if(component.image){
			this.ctx.drawImage(
				component.image,
				component.imageSor.x,component.imageSor.y,
				component.imageSorSize.x,component.imageSorSize.y,
				component.imageDes.x,component.imageDes.y,
				component.imageDesSize.x,component.imageDesSize.y,
			)
		}
		
		if(component.text){
			this.ctx.font = component.font
			this.ctx.textAlign = component.textAlign
			this.ctx.textBaseline = component.textBaseline

			const lineHeight = this.ctx.measureText(component.text).actualBoundingBoxDescent
			const paragraphs = []
			let currentString = ''
			for(let i = 0; i < component.text.length;i++){
				const currentChar = component.text[i]
				if(currentChar === '/'
				&& i + 1 < component.text.length
				&& component.text[i+1] === 'n'){
					paragraphs.push(currentString)
					currentString = ''
					i++
					continue
				}
				currentString += currentChar
			}
			paragraphs.push(currentString)
			currentString = ''

			const lines = []
			const textPos = component.textAlign !== 'start' ? new Vector2D : new Vector2D(component.textPos)

			paragraphs.forEach(paragraph => {
				let paragraphTotalLength = 0
				if(this.ctx.measureText(paragraph).width + textPos.x > component.width){
					for(let i = 0; i < paragraph.length;i++){
						let currentChar = paragraph[i]
						currentString += currentChar
						if(this.ctx.measureText(currentString).width + textPos.x > component.width){
							while(currentChar !== ' '){
								i--
								currentChar = paragraph[i]
							}
							currentString = currentString.slice(0,i - paragraphTotalLength)
							lines.push(currentString)
							paragraphTotalLength += currentString.length
							currentString = ''
						}
					}
					lines.push(currentString)
				}
				else lines.push(paragraph)
			})
			if(component.resizebleByText){
				const totalHeight = lines.length * lineHeight * component.lineSpacing + component.textPos.y
				if(totalHeight > component.height) component.height = totalHeight
			}

			lines.forEach((line,index) => {
				const extraLineSpace = lineHeight * index * component.lineSpacing
				if(component.textFill){
					this.ctx.fillStyle = component.textFill
					this.ctx.fillText(line,component.textPos.x,component.textPos.y + extraLineSpace)
				}
				if(component.textStroke){
					this.ctx.strokeStyle = component.textStroke
					this.ctx.strokeText(line,component.textPos.x,component.textPos.y + extraLineSpace)
				}
			})
		}
		this.ctx.resetTransform()
	}
	clear(){
		this.ctx.globalAlpha = this.opacity ? this.opacity : 1
		this.ctx.fillStyle = this.fill
		this.ctx.fillRect(0,0,this.width,this.height)
	}
	resize(){
		let correctSize = new Vector2D(document.body.offsetWidth,document.body.offsetHeight)

		if(correctSize.x < correctSize.y * game.ratio){
			correctSize.y = correctSize.x / game.ratio
		}
		else correctSize.x = correctSize.y * game.ratio

		this.updateSize(correctSize)
		const diference = Math.min(correctSize.x / game.resolution.x,correctSize.y / game.resolution.y)

		this.zoom = Math.floor(diference * 2 / 0.25) * 0.25 
		
		if(game.currentArea){
			const displayArea = Vector2D.mult(game.currentArea.displaySize,this.zoom)
			
			this.extraSpace.set(Vector2D.sub(correctSize,displayArea).div(2).roundDown())
		}
	}
}