module.exports = function() {

	return {

		omit: function(obj, keys) {

			var o = {};

			for (var key in obj) {
				if(keys.indexOf(key) === -1)
					o[key] = obj[key];				
			}

			return o;
		},
		pick: function(obj, keys) {
			
			var o = {};

			for (var key in obj) {
				if(keys.indexOf(key) !== -1)
					o[key] = obj[key];				
			}

			return o;
		},
		has: function(arr1, arr2) {

			var flag = false;

			for (var i = arr2.length - 1; i >= 0; i--) {
				
				if(arr1.indexOf(arr2[i]) !== -1) {
					flag = true;
					break;
				}
			}

			return flag;
		},
		unique: function(arrArg) {
		  
		  	return arrArg.filter(function(elem, pos, arr) {
		  		return arr.indexOf(elem) == pos;
		  	});
		}
	};
	
}