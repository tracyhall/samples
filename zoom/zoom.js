(function() {
	var root = this;

	var zoomer = function(node, config) {
		var me = this;

		this.container = node;
		this.image = node.getElementsByTagName('img')[0];

		if (!this.image) {
			console.log('no image to zoom');
			return false;
		}

		if (this.image.complete) {
			this.init(config);
		}

		this.image.addEventListener('load', function() {
			me.init(config);
		});
	};

	zoomer.prototype = {
		init: function(config) {
			config = config || {};

			if (this.position) { // not the first init on this image node
				this.image.setAttribute('style', this.cachedStyle);
			} else {
				this.cachedStyle = this.image.getAttribute('style');
			}

			this.position = {
				scale: this.container.clientHeight / this.image.naturalHeight,
				x: 0,
				y: 0,
				width: this.container.clientWidth,
				height: this.container.clientHeight
			};
			this.maxScale = 4 * this.position.scale;
			this.minScale = this.position.scale;


			this.dragging = false;
			this.moved = false;
			this.fullScreen = null; // store starting coordinates of image, for fullscreen zoom on mobile
			this.dragStart = null;
			this.lastPinchScale = null;

			if (!this.eventsBound) {
				this.bindMouseEvents();
				this.bindTouchEvents();
				this.eventsBound = true;
			}
		},

		bindMouseEvents: function() {
			var container = this.container,
				me = this;

			container.addEventListener('DOMMouseScroll', function(e) {
				me.doZoom(me.handleZoomScroll(e));
			});

			container.addEventListener('mousewheel', function(e) {
				me.doZoom(me.handleZoomScroll(e));
			});

			container.addEventListener('mousedown', function(e) {
				e.preventDefault();
				me.dragStart = me.getNormalizedEventCoords(e)[0];
			});

			container.addEventListener('mousemove', function(e) {
				if (me.dragStart) {
					var eventCoords = me.getNormalizedEventCoords(e)[0],
						delta = { 
							x: eventCoords.x - me.dragStart.x,
							y: eventCoords.y - me.dragStart.y
						};

					me.doMove(delta);
				}
			});

			container.addEventListener('mouseup', function() {
				me.dragStart = null;
			});

			container.addEventListener('mouseout', function() {
				me.dragStart = null;
			});
		},

		bindTouchEvents: function() {
			var container = this.container,
				me = this;

			container.addEventListener('touchstart', function(e) {
				e.preventDefault();
				if (me.fullScreen) {
					me.dragStart = me.getNormalizedEventCoords(e);
				}
			});

			container.addEventListener('touchmove', function(e) {
				if (me.dragStart) {
					me.moved = true;
					if (e.targetTouches.length === 1) {
						var eventCoords = me.getNormalizedEventCoords(e)[0],
							delta = { 
								x: eventCoords.x - me.dragStart.x,
								y: eventCoords.y - me.dragStart.y
							};
						me.doMove(delta);
					} else if (e.targetTouches.length === 2) {
						me.doZoom(me.handlePinchGesture(e));
					}
				}
			});

			container.addEventListener('touchend', function(e) {
				var container = me.container;
				me.dragStart = null;
				
				console.log(me.moved);

				if (me.fullScreen) {
					if (!me.moved) {
						me.stopFullScreen();
					}
					me.moved = false;
				} else {
					me.startFullScreen();
				}
			});
		},

		startFullScreen: function() {
			var me = this,
				container = this.container,
				rect = container.getBoundingClientRect();

			this.fullScreen = rect;

			container.style.top = rect.top + 'px';
			container.style.left = rect.left + 'px';
			container.style.position = 'fixed';
			TweenLite.to(container, .1, {
				'top': '0',
				'left': '0',
				'width': '100vw',
				'height': '100vh',
				'background-color': '#fff',
				onComplete: function() {
					me.reset();
				}
			});
		},

		stopFullScreen: function() {
			var me = this;

			TweenLite.to(this.container, .1, {
				'top': me.fullScreen.top + 'px',
				'left': me.fullScreen.left + 'px',
				'width': me.fullScreen.width + 'px',
				'height': me.fullScreen.height + 'px',
				'background-color': 'none',
				onComplete: function() {
					me.container.style.position = 'static';
					me.reset();
				}
			});
			this.fullScreen = null;
			this.moved = null;
			this.lastPinchScale = null;
		},

		getNormalizedEventCoords: function(e) {
			var events = [];

			if (e.targetTouches) {
				for (var i = 0, l = e.targetTouches.length; i < l; i++) {
					var touch = e.targetTouches[i];
					events.push({ x: touch.screenX, y: touch.screenY });
				}
			} else {
				var rect = e.target.getBoundingClientRect();

				eventX = e.offsetX || (e.pageX - rect.left); // find mouse location relative to container
				eventY = e.offsetY || (e.pageY - rect.top);

				events.push({ x: eventX, y: eventY });
			}
			

			return events;
		},

		handleZoomScroll: function(e) {
			e.preventDefault();
			// if wheeldelta, divide it by 40 and use it. if detail, use it negative. else, fail.
			var scaleDelta = e.wheelDelta ? e.wheelDelta/40 : e.detail ? -e.detail : false,
				eventCoords = this.getNormalizedEventCoords(e)[0];

			return { delta: scaleDelta, eventX: eventCoords.x, eventY: eventCoords.y };
		},

		handlePinchGesture: function(e) {
			var eventCoords = this.getNormalizedEventCoords(e),
				p1 = eventCoords[0],
				p2 = eventCoords[1],
				diff = {
					x: (p2.x - p1.x) / 2,
					y: (p2.y - p1.y) / 2
				},
				pinchScale = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2)),
				scaleDelta = (this.lastPinchScale) ? pinchScale - this.lastPinchScale : pinchScale;
				eventCoords = {
					x: p1.x + diff.x,
					y: p1.y + diff.y
				};

				this.lastPinchScale = pinchScale;

			return { delta: scaleDelta, eventX: eventCoords.x, eventY: eventCoords.y };

		},

		doMove: function(delta) {
			var position = this.position; // copy position object for scale, width, and height

			position.x = position.x + delta.x;
			position.y = position.y + delta.y;
			this.update(position);
		},

		doZoom: function(scaleInfo) {
			if (!scaleInfo) return;

			// zoom calculations ripped shamelessly from accepted answer at
			// http://stackoverflow.com/questions/4023876/how-do-i-effectively-calculate-zoom-scale
			var newScale = this.position.scale + (scaleInfo.delta / 100),
				deltaScale = newScale - this.position.scale,
				delta = {
					width: this.image.naturalWidth * deltaScale,
					height: this.image.naturalHeight * deltaScale
				},
				zoomPoint = {
					x: scaleInfo.eventX || this.container.clientWidth / 2,
					y: scaleInfo.eventY || this.container.clientHeight / 2
				},
				mapped = {
					x: -this.position.x + zoomPoint.x,
					y: -this.position.y + zoomPoint.y
				},
				coefficient = {
					x: -mapped.x / this.position.width,
					y: -mapped.y / this.position.height
				},
				position = {
					scale: newScale,
					width: this.position.width + delta.width,
					height: this.position.height + delta.height,
					x: this.position.x + (delta.width * coefficient.x),
					y: this.position.y + (delta.height * coefficient.y)
				};

			this.update(position);
		},

		update: function(position) {
			// test new position to see if scale and image edges are outside acceptable range
			if ((position.scale < this.minScale || position.scale > this.maxScale)) {
				return;
			}

			if (position.x > 0) {
				position.x = 0;
			} else if (position.x + position.width < this.container.clientWidth) {
				position.x = this.container.clientWidth - position.width;
			}

			if (position.y > 0) {
				position.y = 0;
			} else if (position.y + position.height < this.container.clientHeight) {
				position.y = this.container.clientHeight - position.height;
			}
		
			this.position = position;
			
			TweenLite.to(this.image, .1, {
				width: position.width,
				height: position.height,
				marginTop: position.y + 'px',
				marginLeft: position.x + 'px'
			});
		},

		reset: function() {
			var container = this.container;
			this.image.setAttribute('style', this.cachedStyle);
			this.position = {
				scale: container.clientHeight / this.image.naturalHeight,
				x: 0,
				y: 0,
				width: container.clientWidth,
				height: container.clientHeight
			};

			this.maxScale = 4 * this.position.scale;
			this.minScale = this.position.scale;
		}
	};

	root.zoomer = zoomer;
}).call(this);