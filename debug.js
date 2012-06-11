exports.debug = {
	active: false,
	on: function () {
		this.active = true;
	},
	log: function (msg) {
		if (!this.active) return;
		console.log(msg);
	}
};