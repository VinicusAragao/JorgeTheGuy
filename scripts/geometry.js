export class Vector2D{
	constructor(arg1,arg2){
		this.x = 0
		this.y = 0

		if(typeof arg1 === 'object' && arg1 !== null){
			this.x = arg1.x !== undefined ? Number(arg1.x) : Number(arg1[0])
			this.y = arg1.y !== undefined ? Number(arg1.y) : Number(arg1[1])
		}
		else{
			if(arg2 === undefined || arg2 === null){
				this.x = arg1 ? Number(arg1) : 0 
				this.y = arg1 ? Number(arg1) : 0
			}
			else{
				this.x = arg1 ? Number(arg1) : 0 
				this.y = arg2 ? Number(arg2) : 0
			}
		}
	}
	set(arg1,arg2){
		if(typeof arg1 === 'object' && arg1 !== null){
			this.x = arg1.x !== undefined ? Number(arg1.x) : Number(arg1[0])
			this.y = arg1.y !== undefined ? Number(arg1.y) : Number(arg1[1])
		}
		else{
			if(arg2 === undefined || arg2 === null){
				this.x = arg1 ? Number(arg1) : 0 
				this.y = arg1 ? Number(arg1) : 0
			}
			else{
				this.x = arg1 ? Number(arg1) : 0 
				this.y = arg2 ? Number(arg2) : 0
			}
		}
		return this
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
		return this
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
		return this
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
		return this
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
		return this
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
		this.x = Math.abs(this.x)
		this.y = Math.abs(this.y)
		return this
	}
	limitTo(value){
		if(value){
			this.x = this.x > value ? value : this.x < -value ? -value : this.x
			this.y = this.y > value ? value : this.y < -value ? -value : this.y
		}
		return this 
	}
	roundDown(){
		this.x = Math.floor(this.x)
		this.y = Math.floor(this.y)
		return this
	}
	static limitTo(arg1,arg2){
		return new Vector2D(arg1).limitTo(arg2)
	}
	static normalize(arg1,arg2){
		const result = new Vector2D(arg1,arg2)
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
		vector.x = Math.abs(vector.x)
		vector.y = Math.abs(vector.y)
		return vector
	}
	static atan2(vector){
		return Math.atan2(vector.y,vector.x)
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
export function randomItem(arr){
	return arr[randomInt(0,arr.length-1)] 
}
export function randomObjectValue(obj){
	const keys = Object.keys(obj)
	return randomItem(keys) 
}