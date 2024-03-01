import {Vector2D,getManhatthanDistance,getDistance} from './geometry.js'

class Node{
	constructor(x,y,walkable){
		this.x = x
		this.y = y
		this.cell = new Vector2D(x,y)
		this.walkable = walkable
		this.closed = false
		this.parent = null
		this.children = []
		this.g = 0
		this.h = 0
		this.f = 0
	}
	reset(){
		this.walkable = true
		this.closed = false
		this.parent = null
		this.children = []
		this.g = 0
		this.h = 0
		this.f = 0
	}
}
export class Pathfinder{
	constructor(){
		this.nodes = null
		this.rows = 0
		this.cols = 0
		this.canGoDiagonally = false
	}
	tracePath(current,isPossible){
		let node = current
		const path = {
			cells: new Array(current.g),
			isPossible: isPossible,
			length: current.g + 1
		}
		for(let i = current.g; i >= 0;i--){
			path.cells[i] = node
			node = node.parent
		} 
		return path
	}
	getChild(node,longerAxis){
		node.children = []
		const children = []
		if(longerAxis){
			children.push(this.validateChild(node.x+1,node.y))
			children.push(this.validateChild(node.x-1,node.y))
			children.push(this.validateChild(node.x,node.y+1))
			children.push(this.validateChild(node.x,node.y-1))
		}
		else{
			children.push(this.validateChild(node.x,node.y+1))
			children.push(this.validateChild(node.x,node.y-1))
			children.push(this.validateChild(node.x+1,node.y))
			children.push(this.validateChild(node.x-1,node.y))
		}
		if(this.canGoDiagonally){
			children.push(this.validateChild(node.x+1,node.y+1))
			children.push(this.validateChild(node.x-1,node.y-1))
			children.push(this.validateChild(node.x+1,node.y-1))
			children.push(this.validateChild(node.x-1,node.y+1))
		}

		children.forEach(child => {
			if(!child) return
			child.parent = node
			node.children.push(child)
		})
	}
	validateChild(x,y){
		if(x >= 0 && x < this.cols && y >= 0 && y < this.rows){
			const child = this.nodes[y][x]
			if(child.walkable && !child.closed) return child 
		}
		return null
	}
	resetMap(collisionMap){
		this.canGoDiagonally = false
		this.rows = collisionMap.length
		this.cols = collisionMap[0].length

		if(!this.nodes || this.nodes.length !== this.rows || this.nodes[0]?.length !== this.cols){
			this.nodes = new Array(this.rows)
			for(let y = 0; y < this.rows; y++){
				this.nodes[y] = new Array(this.cols)
				for(let x = 0; x < this.cols; x++){
					this.nodes[y][x] = new Node(x,y,collisionMap[y][x])
				}
			}
		}
		else{
			for(let y = 0; y < this.rows; y++){
			for(let x = 0; x < this.cols; x++){
				const node = this.nodes[y][x]
				node.reset()
				node.walkable = collisionMap[y][x]
			}}
		}
	}
	getPath(start,end,collisionMap,canGoDiagonally,rangePreference){
		this.resetMap(collisionMap)
		this.canGoDiagonally = canGoDiagonally

		const open = new Array
		const initialNode = this.nodes[start.y][start.x]
		const finalNode = this.nodes[end.y][end.x]

		finalNode.walkable = true
		
		initialNode.h = this.canGoDiagonally ? getDistance(initialNode,finalNode) : getManhatthanDistance(initialNode,finalNode) 
		initialNode.f = initialNode.h
		open.push(initialNode)

		while(open.length){
			const current = open[open.length - 1]
			current.closed = true
			open.pop()

			if(current === finalNode) return this.tracePath(current,true)

			let longerAxis = Math.abs(finalNode.x - current.x) < Math.abs(finalNode.y - current.y)
			longerAxis = rangePreference ? !longerAxis : longerAxis 
			this.getChild(current,longerAxis)

			for(const child of current.children){
				child.g = current.g + 1
				child.h = this.canGoDiagonally ? getDistance(child,finalNode) : getManhatthanDistance(child,finalNode)
				child.f = child.g + child.h

				let isInOpen = false
				let index = 0


				for(let i = 0; i < open.length;i++){
					const node = open[i]
					
					if(child.f <= node.f) index = i + 1
					if(child === node){
						isInOpen = true
						
						if(child.g < node.g){
							console.log('AAAAAAAAAAAAAAAAAAAA')
							open.splice(i,1)
							open.splice(index,0,child)
						}
						break
					}
				}
				if(!isInOpen) open.splice(index,0,child)
			}
		}

		let closestNode = {h:Infinity,g:Infinity}		
		for(let y = 0; y < this.nodes.length;y++){
		for(let x = 0; x < this.nodes[y].length;x++){
			const node = this.nodes[y][x]
			if((node.h > 0 && node.h < closestNode.h)
			|| (node.h === closestNode.h && node.g < closestNode.g)){
				closestNode = node
			}	
		}}

		return this.tracePath(closestNode,false)
	}
	getEscapePath(start,end,collisionMap,canGoDiagonally,minimumDistance){
		this.resetMap(collisionMap)
		this.canGoDiagonally = canGoDiagonally
		const open = new Array
		const initialNode = this.nodes[start.y][start.x]
		const finalNode = this.nodes[end.y][end.x]

		finalNode.walkable = true

		initialNode.h = getManhatthanDistance(initialNode,finalNode)
		initialNode.f = initialNode.h
		open.push(initialNode)
	}
}


