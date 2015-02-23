var express = require('express'),
	fs = require('fs'),
	basicAuth = require('basic-auth'),
	config;

module.exports.create = function(server, host, port, publicDir, generalConfig) {
	config = generalConfig;
	var app = express();

	security(app);

	app.use(express.static(publicDir));
	//loadFilesInfo();
	bind(app);
	return app;
};

function security(app) {
	var auth = function(req, res, next) {
		function unauthorized(res) {
			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			return res.sendStatus(401);
		}

		var user = basicAuth(req);

		if (!user || !user.name || !user.pass) {
			return unauthorized(res);
		}

		if (user.name === config.user.name && user.pass === config.user.password) {
			return next();
		} else {
			return unauthorized(res);
		}
	};

	// bind
	app.use(auth);
}

var rawFiles = [];

function loadFilesInfo() {
	var mainFolder = config.images_folder,
		files = [];

	files = fs.readdirSync(mainFolder)
		.filter(function(dayFolder) {
			return /^-?[0-9]{8}$/.test(dayFolder);
		})
		.map(function(dayFolder) {
			return {
				name: dayFolder,
				images: fs.readdirSync(mainFolder + '/' + dayFolder).map(function(fileName) {
					return fileName;
				})
			};
		});

	rawFiles = files;

	/*
	    res = walk(imagesFolder);
	    function walk (dir) {
	        res = [];
	        var list = fs.readdirSync(dir);
	        list.forEach(function(fileName) {
	            file = dir + '/' + fileName;
	            var stat = fs.statSync(file);
	            if (stat && stat.isDirectory()) {
	                if(ignoreFolders.indexOf(fileName) == -1) {
	                    res = res.concat(walk(file));
	                }
	            } else {
	                if (fileName.indexOf('.html') > 0) {
	                    res.push(file);
	                }
	            }
	        });
	        return res;
	    }
	    return  res;
	    */
}

var cams = {
	cam1: "00_D6_17_07_3C_BB_JWEV",
	cam2: "00_D7_16_06_38_5F_JWEV"
};

function getLastImage() {
	var mainFolder = config.images_folder,
		images = {};

	var lastDay = fs.readdirSync(mainFolder)
		.filter(function(dayFolder) {
			return /^-?[0-9]{8}$/.test(dayFolder);
		}).pop();
	var lastImages = fs.readdirSync(mainFolder + '/' + lastDay);

	for (var cam in cams) {
		var camId = cams[cam];
		lastImages.forEach(function(fileName) {
			if (fileName.indexOf(camId) === 0) {
				images[cam] = fileName;
			}
		});
	}

	return {
		day: lastDay,
		cams: images
	};
}

function bind(app) {

	app.post('/images/last', function(req, res) {
		var lastImage = getLastImage();
		res.write(JSON.stringify(lastImage));
		res.end();
	});

	app.get('/image/:date/:name', function(req, res) {
		var date = req.params.date,
			name = req.params.name;
		var file_path = config.images_folder + '/' + date + '/' + name;
		console.log("IMG: ", file_path);
		fs.stat(file_path, function(error, stat) {
			var rs;
			res.writeHead(200, {
				'Content-Type': 'image/jpg',
				'Content-Length': stat.size
			});
			rs = fs.createReadStream(file_path);
			rs.pipe(res);
		});
	});
}