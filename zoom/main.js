var baseUrl = 'http://lorempixel.com/',
	sizes = { 'large': '360/600/', 'thumb': '72/120/' },
	switcher = document.getElementById('switcher'),
	altImages = document.getElementById('altImages'),
	zoomContainer = document.getElementById('zoomContainer'),
	spinner = document.getElementById('spinner'),
	evtMainImageLoad = new Event('mainImageLoad'),
	zoomer = new zoomer(zoomContainer),
	imageSets = {
		'animals': [
			{ 'src': 'animals/1', 'active': true },
			{ 'src': 'animals/2' },
			{ 'src': 'animals/3' },
			{ 'src': 'animals/4' }
		],
		'abstract': [
			{ 'src': 'abstract/1' },
			{ 'src': 'abstract/2' },
			{ 'src': 'abstract/3', 'active': true }
		],
		'cats': [
			{ 'src': 'cats/1' },
			{ 'src': 'cats/2' },
			{ 'src': 'cats/3' },
			{ 'src': 'cats/4', 'active': true },
			{ 'src': 'cats/5' }
		]
	};

document.addEventListener('DOMContentLoaded', function() {
	// switch active images based on image set click
	switcher.addEventListener('click', function(e) {
		var target = e.target,
			current = switcher.querySelectorAll('.active')[0],
			set = target.getAttribute('data-set');

		if (!target.classList.contains('active') && set && imageSets[set]) {
			var imageSet = imageSets[set];

			// clear alt images
			while (altImages.firstChild) {
				altImages.removeChild(altImages.firstChild);
			}

			// loop through image list, setting main image to image.active and adding altImages
			for (var i = 0, l = imageSet.length; i < l; i++) {
				var image = imageSet[i],
					imgNode = new Image;

				if (image.active) {
					updateMainImage(image.src);
					imgNode.classList.add('active');
				}

				imgNode.src = baseUrl + sizes.thumb + image.src;
				altImages.appendChild(imgNode);
			}

			switchActive(current, target);
		}
	});

	// switch main image based on alt image click
	altImages.addEventListener('click', function(e) {
		var target = e.target,
			current = altImages.querySelectorAll('.active')[0],
			splitSrc = target.src.split('/'),
			len = splitSrc.length,
			src = splitSrc[len - 2] + '/' + splitSrc[len - 1];

		updateMainImage(src);
		switchActive(current, target);
	});

	var updateMainImage = function(src) {
		var mainImage = zoomContainer.getElementsByTagName('img')[0];
		spinner.style.display = 'block';
		mainImage.src = baseUrl + sizes.large + src;
		mainImage.addEventListener('load', function() {
			spinner.removeAttribute('style');
			zoomContainer.dispatchEvent(evtMainImageLoad);
		});
	};

	var switchActive = function(old, active) {
		old.classList.remove('active');
		active.classList.add('active');
	};

});