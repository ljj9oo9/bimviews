"use strict"

/**
 * Class: BIMSURFER.Control.ClickSelect
 * Control to select and hightlight a Scene JS by clicking on it.
 */
BIMSURFER.Control.ClickSelect = BIMSURFER.Class(BIMSURFER.Control, {
	CLASS: "BIMSURFER.Control.ClickSelect",

	/**
	 * X coordinate of the last mouse event
	 */
	downX: null,

	/**
	 * Y coordinate of the last mouse event
	 */
	downY: null,
	
	active: false,

	/**
	 * The selected and highlighted SceneJS node
	 */
	highlighted: null,

	/**
	 * Timestamp of the last selection
	 */
	lastSelected: 0,
	nodeID: null,
	material:"无",

	/**
	 * Constructor.
	 *
	 * @constructor
	 */
	__construct: function() {
		this.events = new BIMSURFER.Events(this);
	},

	/**
	 * Activates the contol
	 */
	activate: function() {
		if(this.SYSTEM == null || !this.SYSTEM.sceneLoaded) {
			console.error('Cannot activate ' + this.CLASS + ': Surfer or scene not ready');
			return null;
		}
		if (!this.active) {
			this.active = true;
			this.initEvents();
			this.events.trigger('activated');
		}
		return this;
	},

	/**
	 * Initializes the events necessary for the operation of this control
	 *
	 * @return this
	 */
	initEvents: function() {
		if(this.active) {
			this.SYSTEM.events.register('pick', this.pick, this);
			this.SYSTEM.events.register('mouseDown', this.mouseDown, this);
			this.SYSTEM.events.register('mouseUp', this.mouseUp, this);
		} else {
			this.SYSTEM.events.unregister('pick', this.pick, this);
			this.SYSTEM.events.unregister('mouseDown', this.mouseDown, this);
			this.SYSTEM.events.unregister('mouseUp', this.mouseUp, this);
		}
		return this;
	},

	/**
	 * Event listener
	 *
	 * @param {mouseEvent} e Mouse event
	 */
	mouseDown: function(e) {
		this.downX = e.offsetX;
		this.downY = e.offsetY;
	},

	/**
	 * Event listener
	 *
	 * @param {mouseEvent} e Mouse event
	 */
	mouseUp: function(e) {
		if(((e.offsetX > this.downX) ? (e.offsetX - this.downX < 5) : (this.downX - e.offsetX < 5)) &&	((e.offsetY > this.downY) ? (e.offsetY - this.downY < 5) : (this.downY - e.offsetY < 5))) {
			if(Date.now() - this.lastSelected > 10) {
				this.unselect();

			}
		}
	},

	/**
	 * Event listener
	 *
	 * @param {SceneJS.node} hit Selected SceneJS node
	 */
	pick: function(hit) {
		this.unselect();
		this.highlighted = this.SYSTEM.scene.findNode(hit.nodeId);
		var groupId = this.highlighted.findParentByType("translate").data.groupId;

		var matrix = this.highlighted.nodes[0];
		var geometryNode = matrix.nodes[0];

		if (geometryNode._core.arrays.colors != null) {
			var geometry = {
				type: "geometry",
				primitive: "triangles"
			};

			geometry.coreId = geometryNode.getCoreId() + "Highlighted";
			geometry.indices = geometryNode._core.arrays.indices;
			geometry.positions = geometryNode._core.arrays.positions;
			geometry.normals = geometryNode._core.arrays.normals;

			geometry.colors = [];
			for (var i=0; i<geometryNode._core.arrays.colors.length; i+=4) {
				geometry.colors[i] = 0.1;
				geometry.colors[i+1] = 0.7;
				geometry.colors[i+2] = 0.6;
				geometry.colors[i+3] = 0.1;
			}

			var library = this.SYSTEM.scene.findNode("library-" + groupId);
			library.add("node", geometry);

			var newGeometry = {
				type: "geometry",
				coreId: geometryNode.getCoreId() + "Highlighted"
			}

			matrix.removeNode(geometryNode);
			matrix.addNode(newGeometry);
		}

		this.nodeID = "tips" + hit.nodeId;
		//var tipsNode = this.createTipsNode("test.png", this.nodeID, "" + hit.nodeId, hit.worldPos[0], hit.worldPos[1], hit.worldPos[2]);
		this.highlighted.insert('node', BIMSURFER.Constants.highlightSelectedObject);
		//this.highlighted.addNode(tipsNode);
		this.lastSelected = Date.now();
		var o = this;
		window.setTimeout(function(){
			o.events.trigger('select', [groupId, o.highlighted]);
			o.getMaterial(globalProject,hit.nodeId,o);

			$("#divs").slideDown("3000"); //慢慢展开  hj add
			$("#divs").html("材料："+o.material);   // hj add
			$("#divs").css("top", hit.canvasPos[0] - 60);
			$("#divs").css("left",hit.canvasPos[1] - 72);
			o.getModelInfo(globalProject,hit.nodeId);
			/*Global.bimServerApi.call("Bimsie1ServiceInterface", "getProjectByPoid", {poid: "131073"}, function(){
			 Global.bimServerApi.call("Bimsie1ServiceInterface", "getRevision", {roid: "65539"}, function(revision){
			 alert(JSON.stringify(revision));
			 });
			 });*/

			/* Global.bimServerApi.call("Bimsie1ServiceInterface", "getAllRevisionsOfProject", {poid: globalProject.oid}, function(data){
			 data.forEach(function(revision){
			 revision.oid;
			 });
			 });*/

			/*var data = {
			 downloadType: "query",
			 allowCheckouts: false,
			 poid: "131073",
			 roid: "65539",
			 qeid: "196684",
			 code: "Select $Var1\nWhere $Var1.EntityType = IfcDoor",
			 serializerOid:"3735590",
			 showOwn:true,
			 sync:false,
			 zip:false
			 };
			 Global.bimServerApi.call("Bimsie1ServiceInterface", "downloadQuery", data, function(data){
			 var laid = parseInt(data);
			 var url = Global.bimServerApi.generateRevisionDownloadUrl({
			 topicId: laid,
			 zip: false,
			 serializerOid: "3735590",
			 laid: laid
			 });
			 var xhr = new XMLHttpRequest();
			 xhr.open("GET", url);
			 xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
			 xhr.onload = function(jqXHR, textStatus, errorThrown) {
			 if (xhr.status === 200) {
			 var data = JSON.stringify(xhr.responseText);
			 } else {
			 if (error != null) {
			 error(jqXHR, textStatus, errorThrown);
			 }
			 }
			 };
			 xhr.send(null);
			 }, null);*/
		}, 0);

	},

	/**
	 * Event listener
	 */
	unselect: function() {
		//var tipsNode = this.SYSTEM.scene.findNode(this.nodeID);
		var highlighted = this.SYSTEM.scene.findNode(BIMSURFER.Constants.highlightSelectedObject.id);
		if (highlighted != null) {
			var matrix = highlighted.nodes[0];
			var geometryNode = matrix.nodes[0];
			if (geometryNode._core.arrays.colors != null) {
				matrix.removeNode(geometryNode);
				var newGeometry = {
					type: "geometry",
					coreId: geometryNode.getCoreId().replace("Highlighted", "")
				}
				matrix.addNode(newGeometry);
			}
			highlighted.splice();
			//tipsNode.destroy();
			this.events.trigger('unselect', [this.highlighted == null ? null : this.highlighted.findParentByType("translate").groupId, this.highlighted]);
			this.highlighted = null;
		}
			$("#divs").hide();/*hj*/
	},
	getPosition: function (array) {
		var size = array.length / 3;
		var x = new Array(size);
		var y = new Array(size);
		var z = new Array(size);
		for (var i = 0; i < size; i++) {
			x[i] = array[i * 3 + 0];
			y[i] = array[i * 3 + 1];
			z[i] = array[i * 3 + 2];
		}


		return new Array(array[this.getMaxIndex(x) * 3], array[this.getMaxIndex(x) * 3 + 1], array[this.getMaxIndex(x) * 3 + 2],
			array[this.getMinIndex(x) * 3], array[this.getMinIndex(x) * 3 + 1], array[this.getMinIndex(x) * 3 + 2],
			array[this.getMaxIndex(y) * 3], array[this.getMaxIndex(y) * 3 + 1], array[this.getMaxIndex(y) * 3 + 2],
			array[this.getMinIndex(y) * 3], array[this.getMinIndex(y) * 3 + 1], array[this.getMinIndex(y) * 3 + 2],
			array[this.getMaxIndex(z) * 3], array[this.getMaxIndex(z) * 3 + 1], array[this.getMaxIndex(z) * 3 + 2],
			array[this.getMinIndex(z) * 3], array[this.getMinIndex(z) * 3 + 1], array[this.getMinIndex(z) * 3 + 2]
		);
	},

	getMaxIndex: function (array) {
		var max = array[0];
		var len = array.length;
		var index = 0;
		for (var i = 1; i < len; i++) {
			if (array[i] > max) {
				max = array[i];
				index = i;
			}
		}
		return index;
	},

	getMinIndex: function (array) {
		var min = array[0];
		var len = array.length;
		var index = 0;
		for (var i = 1; i < len; i++) {
			if (array[i] < min) {
				min = array[i];
				index = i;
			}
		}
		return index;
	},
	createTipsNode: function (img, nodeid, text, xPos, yPos, zPos) {
		//alert(xPos+""+yPos+""+zPos);
		/* var dd= {
		 type: "material",
		 id:nodeid,
		 color: {
		 r: 0.11, g: 0.1, b: 1
		 },
		 alpha: 1.0,
		 nodes: [
		 {
		 type: "geometry",
		 primitive: "lines",
		 positions: [
		 xPos+3,-1,3+zPos,
		 xPos+9,-1,3+zPos,
		 xPos+3,-1,2+zPos,
		 xPos+9,-1,2+zPos,
		 xPos+6.5,-yPos-4.5,4.5+zPos
		 ],
		 indices: [
		 0, 1,
		 0, 2,
		 2, 3,
		 1,3,
		 0,4
		 ],
		 nodes: [
		 {
		 type: "geometry/vectorText",
		 text: text,
		 xPos:xPos+3,
		 yPos:2+zPos,
		 zPos:-1,
		 zoom:"y",
		 size:1
		 }
		 ]
		 }

		 ]
		 };*/
		/* var dd = {
		 type: "material",
		 color: {
		 r: 1.0, g: 0.5, b: 0.5
		 },
		 nodes: [{
		 type: "texture",
		 src: "/js/bimsurfer/lib/scenejs/plugins/node/textures/"+img,
		 applyTo:"color",
		 blendMode:"multiply",
		 id: nodeid,
		 nodes: [
		 {
		 type: "geometry",
		 positions: [
		 xPos + 9, -1, 3 + zPos,
		 xPos + 3, -1, 3 + zPos,
		 xPos + 3, -1, 2 + zPos,
		 xPos + 9, -1, 2 + zPos
		 ],
		 // normals: [0, 3 +zPos, -1, 0, 3 +zPos, -1, 0, 3 +zPos, -1, 0, 3 +zPos, -1],
		 //normals: [0, 3 , -1, 0, 3 , -1, 0, 3 , -1, 0, 3 , -1],
		 //normals: [0, 3 , -1 +zPos, 0, 3 , -1 +zPos, 0, 3 , -1 +zPos, 0, 3 , -1 +zPos],
		 uv: [0.5, 1, 0, 1, 0, 0, 0.5, 0],
		 indices: [0, 1, 2, 0, 2, 3],
		 nodes: [
		 {
		 /!* type: "material",
		 color: {
		 r: 0.11, g: 0.1, b: 1
		 },
		 alpha: 1.0,*!/
		 nodes: [
		 {
		 type: "geometry",
		 primitive: "lines",
		 positions: [
		 xPos + 3, -1, 3 + zPos,
		 xPos + 9, -1, 3 + zPos,
		 xPos + 3, -1, 2 + zPos,
		 xPos + 9, -1, 2 + zPos,
		 xPos + 6.5, -yPos - 4.5, 4.5 + zPos
		 ],
		 indices: [
		 0, 1,
		 0, 2,
		 2, 3,
		 1, 3,
		 0, 4
		 ],
		 nodes: [
		 {
		 type: "geometry/vectorText",
		 text: text,
		 xPos: xPos + 3,
		 yPos: 2 + zPos,
		 zPos: -1,
		 zoom: "y",
		 size: 1
		 }
		 ]
		 }
		 ]
		 }
		 ]
		 }
		 ]
		 }]}
		 */
		var dd = {
			type: "material",
			id: nodeid,
			color: {
				r: 1.0, g: 0.5, b: 0.5
			},
			nodes: [
				{
					type: "geometry",
					primitive: "lines",
					positions: [
						xPos + 3, -1, 3 + zPos,
						xPos + 9, -1, 3 + zPos,
						xPos + 3, -1, 2 + zPos,
						xPos + 9, -1, 2 + zPos,
						xPos + 6.5, -yPos - 4.5, 4.5 + zPos
					],
					indices: [
						0, 1,
						0, 2,
						2, 3,
						1, 3,
						0, 4
					],
					nodes: [
						{
							type: "geometry/vectorText",
							text: text,
							xPos: xPos + 3,
							yPos: 2 + zPos,
							zPos: -1,
							zoom: "y",
							size: 1
						}
					]
				}, {
					type: "texture",
					src: "/js/bimsurfer/lib/scenejs/plugins/node/textures/" + img,
					applyTo: "color",
					blendMode: "multiply",

					nodes: [
						{
							type: "geometry",
							positions: [
								xPos + 9, -1, 3 + zPos,
								xPos + 3, -1, 3 + zPos,
								xPos + 3, -1, 2 + zPos,
								xPos + 9, -1, 2 + zPos
							],
							uv: [0.5, 1, 0, 1, 0, 0, 0.5, 0],
							indices: [0, 1, 2, 0, 2, 3]
						}
					]
				}
			]
		}


		return dd;
	},
	getMaterial:function (globalProject,oid,obj) {
		Global.bimServerApi.call("Bimsie1LowLevelInterface", "getDataObjectByOid", {roid: globalProject.revisions[0], oid: oid}, function(data){
			if(data.type=="IfcMaterial"){
				data.values.forEach(function(value){
					if (value.__type == "SSimpleDataValue") {
						obj.material= value.stringValue;
					}/*else {
					 return false;
					 }*/
				});
			}else{
				data.values.forEach(function(value){
					if (value.__type == "SListDataValue") {
						value.values.forEach(function(item){
							if (item.__type == "SReferenceDataValue") {
								if(item.typeName=="IfcRelAssociatesMaterial" ){
									obj.getMaterial(globalProject,item.oid,obj);
								}else if (item.typeName=="IfcMaterialLayer" ){
									obj.getMaterial(globalProject,item.oid,obj);
								}/*else{
								 return false;
								 }
								 }else {
								 return false;*/
							}
						});
					}else if(value.__type == "SReferenceDataValue") {
						if(value.typeName=="IfcMaterial" && value.fieldName=="Material"){
							obj.getMaterial(globalProject,value.oid,obj);
						}else if(value.typeName=="IfcMaterialLayerSetUsage" && value.fieldName=="RelatingMaterial"){
							obj.getMaterial(globalProject,value.oid,obj);
						}else if(value.typeName=="IfcMaterialLayerSet" && value.fieldName=="ForLayerSet"){
							obj.getMaterial(globalProject,value.oid,obj);
						}/*else{
						 return false;
						 }
						 }else{
						 return false;*/
					}
				});
			}
		});
	},
	getModelInfo:function (globalProject,oid) {
		Global.bimServerApi.call("Bimsie1LowLevelInterface", "getDataObjectByOid", {roid: globalProject.revisions[0], oid: oid}, function(data){
			var name,height=null,width=null;
			var html="";
			data.values.forEach(function(value){
				if (value.__type == "SSimpleDataValue") {
					if(value.fieldName=="Name"){
						name=value.stringValue;
					}
					if(value.fieldName=="OverallHeight"){
						height=value.stringValue;
					}
					if(value.fieldName=="OverallWidth"){
						width=value.stringValue;
					}
				}
			});
			if(height!=null && width!=null){
				html="构建名称："+name+"<br>"+"高："+height+"<br>"+"款："+width;
			}else{
				html="构建名称："+name;
			}
			$("#divdetail").slideDown("3000"); //慢慢展开  hj add
			$("#divdetail ul li").html(html);   // hj add
		});
	},
	printJson: function (obj) {
		var seen = [];
		var json = JSON.stringify(obj, function (key, val) {
			if (typeof val == "object") {
				if (seen.indexOf(val) >= 0) return;
				seen.push(val)
			}
			return val;
		});
		return json;
	}
});