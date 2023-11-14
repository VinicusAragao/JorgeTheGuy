import {getManhatthanDistance} from './geometry.js'

class Node{
	constructor(x,y,walkable){
		this.x = x
		this.y = y
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
	}
	tracePath(current){
		let node = current
		const path = new Array(current.g)
		for(let i = current.g; i >= 0;i--){
			path[i] = Object.assign({},node)
			node = node.parent
		} 
		return path
	}
	getChild(node,x,y){
		if(x >= 0 && x < this.cols && y >= 0 && y < this.rows){
			const child = this.nodes[y][x]
			if(child.walkable && !child.closed){
				child.parent = node
				node.children.push(child)
			}
		}
	}
	getPath(start,end,collisionMap){
		const startTime = performance.now()
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
		const open = new Array
		const initialNode = this.nodes[start.y][start.x]
		const finalNode = this.nodes[end.y][end.x]
		
		initialNode.h = getManhatthanDistance(initialNode,finalNode)
		initialNode.f = initialNode.h 
		open.push(initialNode)

		




		while(open.length > 0){
			let current = {f:Infinity}
			let currentIndex = 0

			open.forEach((node,index) => {
				if(node.f < current.f){
					current = node
					currentIndex = index
				}
			})
			open.splice(currentIndex,1)
			current.closed = true
			this.nodes[current.y][current.x].closed = true

			if(current === finalNode) return this.tracePath(current)

			current.children = []
			this.getChild(current,current.x + 1,current.y)
			this.getChild(current,current.x - 1,current.y)
			this.getChild(current,current.x,current.y + 1)
			this.getChild(current,current.x,current.y - 1)

			for(const child of current.children){
				child.g = current.g + 1
				child.h = getManhatthanDistance(child,finalNode)
				child.f = child.g + child.h

				let isInOpen = false
				open.forEach((node,index) => {
					if(child === node){
						isInOpen = true
						if(child.g < node.g) open[index] = child
					}
				})
				if(!isInOpen) open.push(child)
			}
		}

		let current = {h:Infinity}
		for(let y = 0; y < this.nodes.length;y++){
		for(let x = 0; x < this.nodes[y].length;x++){
			const node = this.nodes[y][x]
			if(node.h > 0 && current.h > node.h){
				current = node
			}	
		}}
		const path = this.tracePath(current)
		return this.tracePath(current)
	}
}


