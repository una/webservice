// This file is part of Pa11y Webservice.
//
// Pa11y Webservice is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Pa11y Webservice is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Pa11y Webservice.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

var _ = require('underscore');
var Joi = require('joi');

// Routes relating to all tasks
module.exports = function(app) {
	var model = app.model;
	var server = app.server;

	// Get all tasks
	server.route({
		method: 'GET',
		path: '/tasks',
		handler: function(req, reply) {
			model.task.getAll(function(err, tasks) {
				if (err || !tasks) {
					return reply().code(500);
				}
				if (req.query.lastres) {
					model.result.getAll({}, function(err, results) {
						if (err || !results) {
							return reply().code(500);
						}
						var resultsByTask = _.groupBy(results, 'task');
						tasks = tasks.map(function(task) {
							if (resultsByTask[task.id] && resultsByTask[task.id].length) {
								task.last_result = resultsByTask[task.id][0];
							} else {
								task.last_result = null;
							}
							return task;
						});
						reply(tasks).code(200);
					});
				} else {
					reply(tasks).code(200);
				}
			});
		},
		config: {
			validate: {
				query: {
					lastres: Joi.boolean()
				},
				payload: false
			}
		}
	});

	// Create a task
	server.route({
		method: 'POST',
		path: '/tasks',
		handler: function(req, reply) {
			model.task.create(req.payload, function(err, task) {
				if (err || !task) {
					return reply().code(500);
				}
				reply(task)
					.header('Location', 'http://' + req.info.host + '/tasks/' + task.id)
					.code(201);
			});
		},
		config: {
			validate: {
				query: {},
				payload: {
					name: Joi.string().required(),
					timeout: Joi.number().integer(),
					wait: Joi.number().integer(),
					beforeScript: Joi.string().allow(''),
					url: Joi.string().required(),
					username: Joi.string().allow(''),
					password: Joi.string().allow(''),
					standard: Joi.string().required().valid([
						'Section508',
						'WCAG2A',
						'WCAG2AA',
						'WCAG2AAA'
					]),
					ignore: Joi.array(),
					hideElements: Joi.string().allow(''),
					headers: [
						Joi.string().allow(''),
						Joi.object().pattern(/.*/, Joi.string().allow(''))
					]
				}
			}
		}
	});

	// Get results for all tasks
	server.route({
		method: 'GET',
		path: '/tasks/results',
		handler: function(req, reply) {
			model.result.getAll(req.query, function(err, results) {
				if (err || !results) {
					return reply().code(500);
				}
				reply(results).code(200);
			});
		},
		config: {
			validate: {
				query: {
					from: Joi.string().isoDate(),
					to: Joi.string().isoDate(),
					full: Joi.boolean()
				},
				payload: false
			}
		}
	});

};
