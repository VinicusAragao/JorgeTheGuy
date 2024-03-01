export class RelationManager{
	constructor(entity){
		this.entity = entity
		this.relations = []
	}
	gotAttackedBy(entity){
		if(entity.faction === this.entity.faction){
			const relation = this.getRelationWith(entity)
			if(relation){
				if(!relation.getHostility(entity)){
					relation.setHostility(entity,true)
				}
			}
			else{
				const newRelation = this.startRelation(entity)
				newRelation.setHostility(entity,true)
			}
		}
	}
	hostilityAgainst(entity){
		const relation = this.getRelationWith(entity)
		if(relation) return relation.getHostility(this)
		else return false
	}
	startRelation(entity){
		return new Relation(this,entity.relationManager)
	}
	endRelation(relationToEnd){
		this.relations.findAndRemove(relationToEnd)
	}
	getRelationWith(entity){
		for(const relation of this.relations){
			if(relation.getOtherEntity(this.entity) === entity) 
				return relation
		}
		return false
	}
	clearAllRelations(){
		this.relations.forEach(relation => {
			relation.getOtherManager(this).endRelation(relation)
		})
		this.relations = []
	}
}
class Relation{
	constructor(manager1,manager2){
		this.manager1 = manager1
		this.manager2 = manager2
		this.entity1 = manager1.entity
		this.entity2 = manager2.entity

		this.entity1Hostile = false
		this.entity2Hostile = false

		manager1.relations.push(this)
		manager2.relations.push(this)
	}
	getManager(manager){return manager === this.manager1 ? this.manager1 : this.manager2}
	getOtherManager(manager){return manager === this.manager1 ? this.manager2 : this.manager1}
	
	getEntity(entity){return entity === this.entity1 ? this.entity1 : this.entity2}
	getOtherEntity(entity){return entity === this.entity1 ? this.entity2 : this.entity1 }

	getHostility(entity){return entity === this.entity1 ? this.entity1Hostile : this.entity2Hostile}
	setHostility(entity,value){entity === this.entity1 ? this.entity1Hostile = value : this.entity2Hostile = value}
}