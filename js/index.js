'use strict';

Array.prototype.shuffle = function() {
    var input = this;
     
    for(var i = input.length-1; i >=0; i--) {
     
        var randomIndex    = Math.floor(Math.random()*(i+1)); 
        var itemAtIndex    = input[randomIndex]; 
         
        input[randomIndex] = input[i]; 
        input[i]           = itemAtIndex;
    }
    return input;
};

var app = angular.module('memorygame', ['ngAnimate']);

app.controller('AppController', ['$scope', 'DataService', function($scope, DataService) {
	$scope.service = DataService; 
    $scope.data    = DataService.data;
}]);

app.factory('DataService', [function() {
	var generate_tiles = function(columns, rows) {
		var pointer        = {
			x: 0,
			y: 0,
			direction: 'x',
			increment: 1,
			isSlotAvailable: function(x, y) {
				return !(x >= columns || y >= rows || x < 0 || y < 0 || tiles[y][x]);
			}
		};
		var tiles          = [];
		var total_tiles    = columns * rows;
		var icons          = ['star', 'cloud', 'run', 'face', 'mood', 'notifications', 'coffee', 'wrench', 'washing-machine', 'truck', 'traffic', 'toys', 'sun', 'subway', 'store', 'cutlery', 'seat', 'roller', 'scissors', 'ruler', 'receipt', 'puzzle-piece', 'drink', 'favorite', 'nature', 'movie', 'image', 'lamp', 'key', 'graduation-cap'].shuffle();
		var assigned_icons = icons.slice(0, total_tiles / 2);
		var result         = [];

		assigned_icons = assigned_icons.concat(assigned_icons).shuffle();

		for(var row = 0; row < rows; row++) {
			tiles[row] = {};
		}

		for(var tile = 0; tile < total_tiles; tile++) {
			tiles[pointer.y][pointer.x] = {
				id: tile + 1,
				icon: assigned_icons[tile],
				flipped: false,
				loaded: false,
				paired: false
			};
			pointer[pointer.direction] += pointer.increment;

			if(!pointer.isSlotAvailable(pointer.x, pointer.y)) {
				pointer[pointer.direction] -= pointer.increment;

				if(pointer.direction === 'x') {
					pointer.direction = 'y';
				} else {
					pointer.direction = 'x';
					pointer.increment = -pointer.increment;
				}

				pointer[pointer.direction] += pointer.increment;
			}
		}

		return tiles;
	};
	
    var service = {
		default_data: {
			gameStarted: false,
			showSettings: false,
			moves: 0,
			score: 0,
			level: 'easy',
			modes: {
				easy: {
					x: 4,
					y: 2
				},
				medium: {
					x: 5,
					y: 4
				},
				hard: {
					x: 6,
					y: 5
				}
			},
			spiral_delay: 50,
			tiles: [],
			flipped: 0,
			pairs_completed: 0,
			game_over: false
		},
		data: {},
		get mode() {
			return service.data.modes[service.data.level];
		},
		startGame: function(level) {
			angular.copy(service.default_data, service.data);
	
			service.data.level       = level;
			service.data.tiles       = generate_tiles(service.mode.x, service.mode.y);
			service.data.gameStarted = true;
		},
		isGameOver: function() {
			if(service.data.pairs_completed === service.mode.x * service.mode.y / 2) {
				service.data.gameStarted = false;
				service.data.gameOver    = true;
				service.data.score 		 = Math.round(10000 / service.data.moves);
			}
		}
    };

    return service;
}]);

app.directive('tile', ['DataService', '$timeout', '$rootScope', function(DataService, $timeout, $rootScope) {
	var tileMatch = function(current_tile) {
		var result = false;
		var rows   = DataService.data.tiles;
		
		for(var key in rows) {
			var row = rows[key];
			
			for(var key in row) {
				var tile = row[key];
				
				if(tile.flipped && tile.id !== current_tile.id && tile.icon === current_tile.icon) {
					result = tile;
				}
			}
		}
		
		return result;
	};
	
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
			var tile = $scope.$eval($attrs.ngModel);
			
            $element.bind('click', function() {
				if(!tile.flipped) {
					$scope.$apply(function() {
						var matched_tile = tileMatch(tile);
						
						if(matched_tile) {
							matched_tile.paired      = true;
							tile.paired              = true;
							DataService.data.flipped = 0;
							DataService.data.pairs_completed++;
							
							DataService.isGameOver();
						} else if(DataService.data.flipped === 1) {
							$rootScope.$broadcast('unflipTiles');	
						}
						
						tile.flipped = true;	
						DataService.data.flipped++;
						DataService.data.moves++;
					});
				}
            });
			
			$rootScope.$on('unflipTiles', function() {
				tile.flipped = false;
				DataService.data.flipped = 0;
			});
			
			$timeout(function() {
				tile.loaded = true;
			}, DataService.data.spiral_delay * tile.id);
        }
    };
}]);