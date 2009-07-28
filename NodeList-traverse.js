dojo.provide("dojo.NodeList-traverse");

/*=====
dojo["NodeList-traverse"] = {
	// summary: Adds a chainable methods to dojo.query() / Nodelist instances for traversing the DOM
};
=====*/

dojo.extend(dojo.NodeList, {
	_buildArrayFromCallback: function(/*Function*/callback){
		// summary:
		// 		builds a new array of possibly differing size based on the input list.
		// 		Since the returned array is likely of different size than the input array,
		// 		the array's map function cannot be used.
		var ary = [];
		for(var i = 0; i < this.length; i++){
			var items = callback.call(this[i], this[i], ary);
			if(items){
				ary = ary.concat(items);
			}
		}
		return ary;	
	},

	_getUniqueAsNodeList: function(nodes){
		// summary:
		// 		given a list of nodes, make sure only unique
		// 		elements are returned as our NodeList object.
		// 		Does not call _stash().
		var ary = [];
		//Using for loop for better speed.
		for(var i = 0, node; node = nodes[i]; i++){
			//Should be a faster way to do this. dojo.query has a private
			//_zip function that may be inspirational, but there are pathways
			//in query that force nozip?
			if(node.nodeType == 1 && dojo.indexOf(ary, node) == -1){
				ary.push(node);
			}
		}
		return this._wrap(ary, null, this._NodeListCtor);	 //dojo.NodeList
	},

	_getUniqueNodeListWithParent: function(nodes, query){
		// summary:
		// 		gets unique element nodes, filters them further
		// 		with an optional query and then calls _stash to track parent NodeList.
		var ary = this._getUniqueAsNodeList(nodes);
		ary = (query ? (this._filterQueryResult || dojo._filterQueryResult)(ary, query) : ary);
		return ary._stash(this);  //dojo.NodeList
	},

	_getRelatedUniqueNodes: function(/*String?*/query, /*Function*/callback){
		// summary:
		// 		cycles over all the nodes and calls a callback
		// 		to collect nodes for a possible inclusion in a result.
		// 		The callback will get two args: callback(node, ary), 
		// 		where ary is the array being used to collect the nodes.
		return this._getUniqueNodeListWithParent(this._buildArrayFromCallback(callback), query);  //dojo.NodeList
	},

	children: function(/*String?*/query){
		// summary:
		// 		Returns all immediate child elements for nodes in this dojo.NodeList.
		// 		Optionally takes a query to filter the child elements.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	query:
		//		single-expression CSS rule. For example, ".thinger" or
		//		"#someId[attrName='value']" but not "div > span". In short,
		//		anything which does not invoke a descent to evaluate but
		//		can instead be used to test a single node is acceptable.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		Some Text
		// 	|		<div class="blue">Blue One</div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".container").children();
		//		returns the four divs that are children of the container div.
		//		Running this code:
		//	|	dojo.query(".container").children(".red");
		//		returns the two divs that have the class "red".
		return this._getRelatedUniqueNodes(query, function(node, ary){
			return dojo._toArray(node.childNodes);
		}); //dojo.NodeList
	},

	closest: function(/*String*/query){
		// summary:
		// 		Returns closest parent that matches query, including current node in this
		// 		dojo.NodeList if it matches the query.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	query:
		//		single-expression CSS rule. For example, ".thinger" or
		//		"#someId[attrName='value']" but not "div > span". In short,
		//		anything which does not invoke a descent to evaluate but
		//		can instead be used to test a single node is acceptable.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		Some Text
		// 	|		<div class="blue">Blue One</div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".red").closest(".container");
		//		returns the div with class "container".
		var self = this;
		return this._getRelatedUniqueNodes(query, function(node, ary){
			do{
				if((self._filterQueryResult || dojo._filterQueryResult)([node], query).length){
					return node;
				}
			}while((node = node.parentNode) && node.nodeType == 1);
			return null; //To make rhino strict checking happy.
		}); //dojo.NodeList
	},

	parent: function(/*String?*/query){
		// summary:
		// 		Returns immediate parent elements for nodes in this dojo.NodeList.
		// 		Optionally takes a query to filter the parent elements.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	query:
		//		single-expression CSS rule. For example, ".thinger" or
		//		"#someId[attrName='value']" but not "div > span". In short,
		//		anything which does not invoke a descent to evaluate but
		//		can instead be used to test a single node is acceptable.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		<div class="blue first"><span class="text">Blue One</span></div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue"><span class="text">Blue Two</span></div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".text").parent();
		//		returns the two divs with class "blue".
		//		Running this code:
		//	|	dojo.query(".text").parent(".first");
		//		returns the one div with class "blue" and "first".
		return this._getRelatedUniqueNodes(query, function(node, ary){
			return node.parentNode;
		}); //dojo.NodeList
	},

	parents: function(/*String?*/query){
		// summary:
		// 		Returns all parent elements for nodes in this dojo.NodeList.
		// 		Optionally takes a query to filter the child elements.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	query:
		//		single-expression CSS rule. For example, ".thinger" or
		//		"#someId[attrName='value']" but not "div > span". In short,
		//		anything which does not invoke a descent to evaluate but
		//		can instead be used to test a single node is acceptable.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		<div class="blue first"><span class="text">Blue One</span></div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue"><span class="text">Blue Two</span></div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".text").parents();
		//		returns the two divs with class "blue", the div with class "container",
		// 	|	the body element and the html element.
		//		Running this code:
		//	|	dojo.query(".text").parents(".container");
		//		returns the one div with class "container".
		return this._getRelatedUniqueNodes(query, function(node, ary){
			var pary = []
			while(node.parentNode){
				node = node.parentNode;
				pary.push(node);
			}
			return pary;
		}); //dojo.NodeList
	},

	siblings: function(/*String?*/query){
		// summary:
		// 		Returns all subling elements for nodes in this dojo.NodeList.
		// 		Optionally takes a query to filter the sibling elements.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	query:
		//		single-expression CSS rule. For example, ".thinger" or
		//		"#someId[attrName='value']" but not "div > span". In short,
		//		anything which does not invoke a descent to evaluate but
		//		can instead be used to test a single node is acceptable.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		Some Text
		// 	|		<div class="blue first">Blue One</div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".first").siblings();
		//		returns the two div with class "red" and the other div
		// 	|	with class "blue" that does not have "first".
		//		Running this code:
		//	|	dojo.query(".first").siblings(".red");
		//		returns the two div with class "red".
		return this._getRelatedUniqueNodes(query, function(node, ary){
			var pary = []
			var nodes = (node.parentNode && node.parentNode.childNodes);
			for(var i = 0; i < nodes.length; i++){
				if(nodes[i] != node){
					pary.push(nodes[i]);
				}
			}
			return pary;
		}); //dojo.NodeList
	},

	next: function(/*String?*/query){
		// summary:
		// 		Returns the next element for nodes in this dojo.NodeList.
		// 		Optionally takes a query to filter the next elements.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	query:
		//		single-expression CSS rule. For example, ".thinger" or
		//		"#someId[attrName='value']" but not "div > span". In short,
		//		anything which does not invoke a descent to evaluate but
		//		can instead be used to test a single node is acceptable.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		Some Text
		// 	|		<div class="blue first">Blue One</div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue last">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".first").next();
		//		returns the div with class "red" and has innerHTML of "Red Two".
		//		Running this code:
		//	|	dojo.query(".last").next(".red");
		//		does not return any elements.
		return this._getRelatedUniqueNodes(query, function(node, ary){
			var next = node.nextSibling;
			while(next && next.nodeType != 1){
				next = next.nextSibling;
			}
			return next;
		}); //dojo.NodeList
	},

	prev: function(/*String?*/query){
		// summary:
		// 		Returns the previous element for nodes in this dojo.NodeList.
		// 		Optionally takes a query to filter the previous elements.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	query:
		//		single-expression CSS rule. For example, ".thinger" or
		//		"#someId[attrName='value']" but not "div > span". In short,
		//		anything which does not invoke a descent to evaluate but
		//		can instead be used to test a single node is acceptable.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		Some Text
		// 	|		<div class="blue first">Blue One</div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".first").prev();
		//		returns the div with class "red" and has innerHTML of "Red One".
		//		Running this code:
		//	|	dojo.query(".first").prev(".blue");
		//		does not return any elements.
		return this._getRelatedUniqueNodes(query, function(node, ary){
			var prev = node.previousSibling;
			while(prev && prev.nodeType != 1){
				prev = prev.previousSibling;
			}
			return prev;
		}); //dojo.NodeList
	},

	//Alternate methods for the :first/:last/:even/:odd pseudos.
	first: function(){
		// summary:
		// 		Returns the first node in this dojo.NodeList as a dojo.NodeList.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		<div class="blue first">Blue One</div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue last">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".blue").first();
		//		returns the div with class "blue" and "first".
		return this._wrap(((this[0] && [this[0]]) || []), this); //dojo.NodeList
	},

	last: function(){
		// summary:
		// 		Returns the last node in this dojo.NodeList as a dojo.NodeList.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="red">Red One</div>
		// 	|		<div class="blue first">Blue One</div>
		// 	|		<div class="red">Red Two</div>
		// 	|		<div class="blue last">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".blue").last();
		//		returns the last div with class "blue", 
		return this._wrap((this.length ? [this[this.length - 1]] : []), this); //dojo.NodeList
	},

	even: function(){
		// summary:
		// 		Returns the even nodes in this dojo.NodeList as a dojo.NodeList.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="interior red">Red One</div>
		// 	|		<div class="interior blue">Blue One</div>
		// 	|		<div class="interior red">Red Two</div>
		// 	|		<div class="interior blue">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".interior").even();
		//		returns the two divs with class "blue"
		return this.filter(function(item, i){
			return i % 2 != 0;
		}); //dojo.NodeList
	},

	odd: function(){
		// summary:
		// 		Returns the odd nodes in this dojo.NodeList as a dojo.NodeList.
		// description:
		// 		.end() can be used on the returned dojo.NodeList to get back to the
		// 		original dojo.NodeList.
		//	example:
		//		assume a DOM created by this markup:
		//	|	<div class="container">
		// 	|		<div class="interior red">Red One</div>
		// 	|		<div class="interior blue">Blue One</div>
		// 	|		<div class="interior red">Red Two</div>
		// 	|		<div class="interior blue">Blue Two</div>
		//	|	</div>
		//		Running this code:
		//	|	dojo.query(".interior").odd();
		//		returns the two divs with class "red"
		return this.filter(function(item, i){
			return i % 2 == 0;
		}); //dojo.NodeList
	}
});