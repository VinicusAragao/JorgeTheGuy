import {Vector2D} from './geometry.js'

export class Canvas{
	constructor(){
		this.c = document.querySelector('canvas')
		this.ctx = this.c.getContext('2d')

		this.updateSize(game.resolution.x,game.resolution.y)

		this.zoom = 2
		this.alias = false
		this.fill = '#f00'

		this.c.addEventListener('contextmenu', e => e.preventDefault())
	}
	changeCursor(cursor){
		if(cursor){
			this.c.style.cursor = 'cursor'
			return
		}
		this.c.style.cursor = 'default'
	}
	updateSize(width,height){
		this.width = width
		this.height = height
		this.c.width = this.width
		this.c.height = this.height
	}
	drawImage(img){
		this.ctx.setTransform(this.zoom,0,0,this.zoom,0,0)
		this.ctx.imageSmoothingEnabled = this.alias
		this.ctx.globalAlpha = img.opacity

		this.ctx.drawImage(
			img.image,
			img.sor.x,img.sor.y,
			img.size.x,img.size.y,
			img.des.x,img.des.y,
			img.size.x,img.size.y,
		)
		
		if(img.stroke){
			this.ctx.strokeStyle = img.stroke
			this.ctx.lineWidth = img.strokeWidth ? img.strokeWidth : 1
			this.ctx.strokeRect(img.des.x,img.des.y,img.size.x,img.size.y)	
		}
		this.ctx.resetTransform()
	}
	drawCircle(circ){
		this.ctx.beginPath()
		this.ctx.globalAlpha = circ.opacity
		this.ctx.arc(circ.pos.x,circ.pos.y,circ.r,0,Math.PI*2)
		if(circ.fill){
			this.ctx.fillStyle = circ.fill
			this.ctx.fill()
		}
		if(circ.stroke){
			this.ctx.strokeStyle = circ.stroke
			this.ctx.lineWidth = circ.strokeWidth
			this.ctx.stroke()
		}
	}
	drawRect(rect){
		this.ctx.setTransform(this.zoom,0,0,this.zoom,0,0)

		if(rect.fill){
			this.ctx.fillStyle = rect.fill
			this.ctx.fillRect(rect.pos.x,rect.pos.y,rect.w,rect.h)
		}
		if(rect.stroke){
			this.ctx.strokeStyle = rect.stroke
			this.ctx.lineWidth = rect.strokeWidth ? rect.strokeWidth : 1
			this.ctx.strokeRect(rect.pos.x,rect.pos.y,rect.w,rect.h)
		}
		this.ctx.resetTransform()
	}
	drawRotatedRect(rect){
		this.ctx.globalAlpha = rect.opacity ? rect.opacity : 1
		this.ctx.setTransform(this.zoom,0,0,this.zoom,rect.center.x,rect.center.y)
		this.ctx.rotate(rect.radian)

		if(rect.fill){
			this.ctx.fillStyle = rect.fill
			this.ctx.fillRect(-rect.pivot.x,-rect.pivot.y,rect.w,rect.h)
		}
		if(rect.stroke){
			this.ctx.strokeStyle = rect.stroke
			this.ctx.lineWidth = rect.strokeWidth
			this.ctx.strokeRect(-rect.pivot.x,-rect.pivot.y,rect.w,rect.h)
		}
		this.ctx.resetTransform()
	}
	drawText(text){
		this.ctx.globalAlpha = text.opacity
		this.ctx.setTransform(this.zoom,0,0,this.zoom,text.des.x*this.zoom,text.des.y*this.zoom)

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
	drawPoints(points){
		for(const point of points){
			this.ctx.beginPath()
			this.ctx.arc(point.x,point.y,10,0,Math.PI*2)
			this.ctx.fillStyle = '#00f'
			this.ctx.fill()
		}
	}
	drawUI(UIs){
		UIs.forEach(UI => this.drawInterface(UI))
	}
	drawInterface(UI){
		if(!UI.visible || UI.opacity === 0) return
		let components = [UI]

		for(let i = 0; i <= components.length;i++){
			if(i === components.length){
				let nextLayer = []
				for(let j = 0; j < components.length;j++){
					const component = components[j]
					if(!component.visible || component.opacity === 0) continue
					component.children.forEach(child => nextLayer.push(child))
				}
				components = nextLayer
				i = 0
			}
			if(typeof components[i] === 'undefined') return
			this.drawComponent(components[i])
		}
	}
	drawComponent(component){
		if(!component.visible || component.opacity === 0) return
		this.ctx.setTransform(1,0,0,1,component.pos.x,component.pos.y)
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
					i += 2
					continue
				}
				currentString += currentChar
			}
			paragraphs.push(currentString)
			currentString = ''

			const lines = []
			
			paragraphs.forEach(paragraph => {
				let paragraphTotalLength = 0
				if(this.ctx.measureText(paragraph).width + component.textPos.x > component.width){
					for(let i = 0; i < paragraph.length;i++){
						let currentChar = paragraph[i]
						currentString += currentChar
						if(this.ctx.measureText(currentString).width + component.textPos.x > component.width){
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
}