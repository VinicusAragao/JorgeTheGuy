export class Rect{
	constructor(x,y,w,h){
		this.pos = new Vector2D(x,y)
		this.w = w ? w : 0
		this.h = h ? h : 0
		this.pivot = new Vector2D(this.w/2,this.h/2)
		this.center = Vector2D.add(this.pos,this.pivot)
		this.radian = 0
		this.format = 'rect'
		this.basePoints = [new Vector2D,new Vector2D,new Vector2D,new Vector2D]
		this.points = [new Vector2D,new Vector2D,new Vector2D,new Vector2D]
		this.edges = [new Vector2D,new Vector2D,new Vector2D,new Vector2D]
		this.updateSize(this.w,this.h)
	}
	updateSize(w,h){
		if(w && h){
			this.w = w
		 	this.h = h
			this.defineCenter()

			this.basePoints[0].set(this.w/2,-this.h/2)
			this.basePoints[1].set(this.w/2,this.h/2)
			this.basePoints[2].set(-this.w/2,this.h/2)
			this.basePoints[3].set(-this.w/2,-this.h/2)
			this.definePoints()
			this.defineEdges()
		} 
	}
	definePoints(){
		const radX = Math.cos(this.radian)
		const radY = Math.sin(this.radian)

		this.defineCenter()
		for(let i = 0; i < this.basePoints.length;i++){
			const basePoint = this.basePoints[i]
			const point = this.points[i]
			point.set(basePoint)
			point.rotate(radX,radY)
			point.add(this.center)
		}
	}
	defineCenter(){
		this.center.set(Vector2D.add(this.pos,this.pivot))
	}
	defineEdges(){
		this.definePoints()
		for(let i = 0; i < this.points.length;i++){
			const a = this.points[i]
			const b = i+1 < this.points.length ? this.points[i+1] : this.points[0]
			this.edges[i].set(b.x - a.x, b.y - a.y)
		}
	}
	projectInAxis(axis){
		let min = Infinity
		let max = -Infinity
		
		const num = Math.sqrt(axis.x * axis.x + axis.y * axis.y)
		for(const point of this.points){
		    const projection = (point.x * axis.x + point.y * axis.y) / num

		    if(projection > max) max = projection
		    if(projection < min) min = projection
		}
		return {min,max}
	}
}
export class Circle{
	constructor(x,y,r){
		this.pos = new Vector2D(x,y)
		this.r = r
		this.format = 'circle'
	}
	projectInAxis(axis){
		const temp = (this.pos.x * axis.x + this.pos.y * axis.y)
		return {
			min: temp - this.r,
			max: temp + this.r
		}
	}
}
export class Vector2D{
	constructor(arg1,arg2){
		this.x = 0
		this.y = 0
		if(typeof arg1 === 'object'){
			this.x = arg1.x 
			this.y = arg1.y 
		}
		else{
			if(arg2 === undefined || arg2 === null){
				this.x = arg1 ? arg1 : 0 
				this.y = arg1 ? arg1 : 0
			}
			else{
				this.x = arg1 ? arg1 : 0 
				this.y = arg2 ? arg2 : 0
			}
		}
	}
	set(arg1,arg2){
		if(arg1 && typeof arg1 === 'object'){
			this.x = arg1.x ? arg1.x : 0
			this.y = arg1.y ? arg1.y : 0 
		}
		else{
			if(arg2 === undefined || arg2 === null){
				this.x = arg1 ? arg1 : 0 
				this.y = arg1 ? arg1 : 0
			}
			else{
				this.x = arg1 ? arg1 : 0 
				this.y = arg2 ? arg2 : 0
			}
		}
	}
	reset(){
		this.x = 0
		this.y = 0
	}
	add(arg1,arg2){
		if(typeof arg1 === 'object'){
			this.x += arg1.x
			this.y += arg1.y
		}
		else{
			if(arg2 === undefined || arg2 === null){
				this.x += arg1 ? arg1 : 0 
				this.y += arg1 ? arg1 : 0
			}
			else{
				this.x += arg1 ? arg1 : 0 
				this.y += arg2 ? arg2 : 0
			}
		}
	}
	sub(arg1,arg2){
		if(typeof arg1 === 'object'){
			this.x -= arg1.x
			this.y -= arg1.y
		}
		else{
			if(arg2 === undefined || arg2 === null){
				this.x -= arg1 ? arg1 : 0 
				this.y -= arg1 ? arg1 : 0
			}
			else{
				this.x -= arg1 ? arg1 : 0 
				this.y -= arg2 ? arg2 : 0
			}
		}
	}
	mult(){
		for(const arg of arguments){
			if(typeof arg === 'object'){
				this.x *= arg.x
				this.y *= arg.y
			}
			else if(typeof arg === 'number'){
				this.x *= arg
				this.y *= arg
			}
		}
	}
	div(){
		for(const arg of arguments){
			if(typeof arg === 'object'){
				this.x /= arg.x
				this.y /= arg.y
			}
			else if(typeof arg === 'number'){
				this.x /= arg
				this.y /= arg
			}
			this.x = isNaN(this.x) ? 0 : this.x
			this.y = isNaN(this.y) ? 0 : this.y 
		} 
	}
	normalize(){
		const length = this.length()
		if(length > 0){
			this.x /= length
			this.y /= length
		}
	}
	rotate(radX,radY){
		const newX = this.x * radX - this.y * radY
		const newY = this.y * radX + this.x * radY
		this.set(newX,newY)
	}
	length(){
		return Math.sqrt(this.x * this.x + this.y * this.y)
	}
	radian(rad){
		return new Vector2D(this.x * Math.cos(rad),this.y * Math.sin(rad))
	}
	abs(){
		const vector = new Vector2D(this)
		vector.x = vector.x < 0 ? -vector.x : vector.x
		vector.y = vector.y < 0 ? -vector.y : vector.y
		return vector
	}
	static normalize(arg1,arg2){
		const result = new Vector2D
		if(arg1 === 'object'){
			result.set(arg1)
		}
		else result.set(arg1,arg2)

		result.normalize()
		return result
	}
	static add(){
		const result = new Vector2D
		for(const arg of arguments){
			result.add(arg)
		}
		return result
	}
	static sub(positive,negative){
		const result = new Vector2D
		result.add(positive)
		result.sub(negative)
		return result
	}
	static mult(){
		const result = new Vector2D(arguments[0])
		for(let i = 1; i < arguments.length;i++){
			result.mult(arguments[i])
		}
		return result
	}
	static div(vector1,vector2){
		const result = new Vector2D(vector1)
		result.div(vector2)
		return result
	}
	static length(vector){
		return Math.sqrt((vector.x*vector.x) + (vector.y*vector.y))
	}
	static radian(vector,rad){
		return new Vector2D(vector.x * Math.cos(rad),vector.y * Math.sin(rad))
	}
	static rotate(vector,radX,radY){
		return new Vector2D(
			vector.x * radX - vector.y * radY,
			vector.y * radX + vector.x * radY
		)
	}
	static abs(vector){
		vector.x = vector.x < 0 ? -vector.x : vector.x
		vector.y = vector.y < 0 ? -vector.y : vector.y
		return vector
	}
}
export function getDistance(vector1,vector2){
	return Math.sqrt(
		(vector2.x - vector1.x) * (vector2.x - vector1.x) + 
		(vector2.y - vector1.y) * (vector2.y - vector1.y)
	)
}
export function getRadian(vector1,vector2){
	return Math.atan2(-(vector2.y - vector1.y),-(vector2.x - vector1.x))
}
export function toRadian(deggre){
	return deggre * Math.PI/180
}
export function randomInt(min,max){
	return Math.floor(Math.random() * ((max+1) - min) + min) 
}
export function randomFloat(min,max){
	return Math.random() * (max - min) + min 
}
export function getManhatthanDistance(vector1,vector2){
	return Math.abs(vector2.x - vector1.x) + Math.abs(vector2.y - vector1.y)
}