import {Vector2D} from './geometry.js'

export class Canvas{
	constructor(){
		this.renderer = new Renderer('#000')

		this.width = game.resolution.x
		this.height = game.resolution.y
		this.renderer.updateSize(this.width,this.height)
		this.renderer.zoom = 2


		this.stage = null
		this.images = null
		this.size = new Vector2D
	}
	drawUI(UIs){
		UIs.forEach(UI => this.renderer.drawUI(UI))
	}
	setStage(stageCell,newImages){
		this.stage = game.world.stages[stageCell.y][stageCell.x]
		this.images = newImages ? newImages : this.images
		this.size.set(this.stage.layers[0].width,this.stage.layers[0].height)

		this.stage.layers.forEach(layer => {
			layer.tiles = new Array(this.size.y)

			for(let y = 0; y < layer.tiles.length; y++){
				layer.tiles[y] = new Array(this.size.x)
				for(let x = 0; x < layer.tiles[y].length; x++){
					const tileset = this.stage.tilesets[0]
					const cell = new Vector2D(x,y)
					const value = layer.data[y * this.size.x + x] - 1

					layer.tiles[y][x] = new Tile(cell,tileset,value)
				}
			}
		})
	}
	getTile(pos){
		return this.stage.layers[0].tiles[pos.y][pos.x]
	}
	drawTiles(){
		this.stage.layers.forEach(layer => {
			layer.tiles.forEach(column => {
				column.forEach(tile => this.renderer.drawImage(tile))
			})
		})
	}
	isValidCell(cell){
		return cell.x >= 0 && cell.x < this.size.x && cell.y >= 0 && cell.y < this.size.y 
	}
}	
class Tile{
	constructor(cell,tileset,value){
		this.cell = cell
		this.tileset = tileset
		this.value = value
		this.stroke = '#333'
		this.strokeWidth = 0.05

		this.image = this.tileset.image
		this.size = new Vector2D(tileset.tilewidth,tileset.tileheight)
		this.des = Vector2D.mult(cell,this.size)
		this.sor = new Vector2D(
			this.size.x * (value % tileset.columns),
			this.size.y * Math.floor(value / tileset.columns)
		)
		this.opacity = 1
		this.entity = null
	}
}
class Renderer{
	constructor(background){
		this.c = document.querySelector('canvas')
		this.ctx = this.c.getContext('2d')

		this.fill = background
		this.alias = false
		
		this.zoom = 1
		this.c.addEventListener('contextmenu', e => e.preventDefault())
	}
	updateSize(width,height){
		this.width = width
		this.height = height
		this.c.width = this.width
		this.c.height = this.height
	}
	strokeTile(tile){
		this.ctx.setTransform(this.zoom,0,0,this.zoom,0,0)
		this.ctx.globalAlpha = tile.opacity
		this.ctx.strokeStyle = tile.stroke
		this.ctx.lineWidth = tile.strokeWidth ? tile.strokeWidth : 1
		this.ctx.strokeRect(tile.des.x,tile.des.y,tile.size.x,tile.size.y)
		this.ctx.resetTransform()
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
	drawRotatedRect(rect){
		this.ctx.globalAlpha = rect.opacity ? rect.opacity : 1
		this.ctx.setTransform(1,0,0,1,rect.center.x,rect.center.y)
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
	drawRect(rect){
		
		if(rect.fill){
			this.ctx.fillStyle = rect.fill
			this.ctx.fillRect(rect.pos.x,rect.pos.y,rect.w,rect.h)
		}
		if(rect.stroke){
			this.ctx.strokeStyle = rect.stroke
			this.ctx.lineWidth = rect.strokeWidth ? rect.strokeWidth : 1
			this.ctx.strokeRect(rect.pos.x,rect.pos.y,rect.w,rect.h)
		}
	}
	drawPoints(points){
		for(const point of points){
			this.ctx.beginPath()
			this.ctx.arc(point.x,point.y,10,0,Math.PI*2)
			this.ctx.fillStyle = '#00f'
			this.ctx.fill()
		}
	}
	drawUI(component){
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
				component.image,0,0,
				component.width,component.height
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
		component.children.forEach(child => this.drawUI(child))
		this.ctx.resetTransform()
	}
	clear(){
		this.ctx.globalAlpha = this.opacity ? this.opacity : 1
		this.ctx.fillStyle = this.fill
		this.ctx.fillRect(0,0,this.width,this.height)
	}
}