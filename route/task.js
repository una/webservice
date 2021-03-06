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

var chalk = require('chalk');
var Joi = require('joi');

// Routes relating to individual tasks
module.exports = function(app) {
	var model = app.model;
	var server = app.server;

	// Get a task
	server.route({
		method: 'GET',
		path: '/tasks/{id}',
		handler: function(req, reply) {
			model.task.getById(req.params.id, function(err, task) {
				if (err) {
					return reply().code(500);
				}
				if (!task) {
					return reply({
						code: 404,
						error: 'Not Found'
					}).code(404);
				}
				if (req.query.lastres) {
					model.result.getByTaskId(task.id, {
						limit: 1,
						full: true
					}, function(err, results) {
						if (err || !results) {
							return reply().code(500);
						}
						task.last_result = null;
						if (results && results.length) {
							task.last_result = results[0];
						}
						reply(task).code(200);
					});
				} else {
					reply(task).code(200);
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

	// Edit a task
	server.route({
		method: 'PATCH',
		path: '/tasks/{id}',
		handler: function(req, reply) {
			model.task.getById(req.params.id, function(err, task) {
				if (err) {
					return reply().code(500);
				}
				if (!task) {
					return reply({
						code: 404,
						error: 'Not Found'
					}).code(404);
				}
				model.task.editById(task.id, req.payload, function(err, updateCount) {
					if (err || updateCount < 1) {
						return reply().code(500);
					}
					model.task.getById(task.id, function(err, task) {
						if (err) {
							return reply().code(500);
						}
						reply(task).code(200);
					});
				});
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
					ignore: Joi.array(),
					comment: Joi.string(),
					username: Joi.string().allow(''),
					password: Joi.string().allow(''),
					hideElements: Joi.string().allow(''),
					headers: [
						Joi.string().allow(''),
						Joi.object().pattern(/.*/, Joi.string().allow(''))
					]
				}
			}
		}
	});

	// Delete a task
	server.route({
		method: 'DELETE',
		path: '/tasks/{id}',
		handler: function(req, reply) {
			model.task.deleteById(req.params.id, function(err, task) {
				if (err) {
					return reply().code(500);
				}
				if (!task) {
					return reply({
						code: 404,
						error: 'Not Found'
					}).code(404);
				}
				model.result.deleteByTaskId(req.params.id, function(err) {
					if (err) {
						return reply().code(500);
					}
					reply().code(204);
				});
			});
		},
		config: {
			validate: {
				query: {},
				payload: false
			}
		}
	});

	// Run a task
	server.route({
		method: 'POST',
		path: '/tasks/{id}/run',
		handler: function(req, reply) {
			model.task.getById(req.params.id, function(err, task) {
				if (err) {
					return reply().code(500);
				}
				if (!task) {
					return reply({
						code: 404,
						error: 'Not Found'
					}).code(404);
				}
				if (process.env.NODE_ENV !== 'test') {
					console.log('');
					console.log(chalk.grey('Starting to run one-off task @ %s'), new Date());
					console.log('Starting task %s', task.id);
					model.task.runById(req.params.id, function(err) {
						if (err) {
							console.log(
								chalk.red('Failed to finish task %s: %s'),
								task.id,
								err.message
							);
						} else {
							console.log(chalk.green('Finished task %s'), task.id);
						}
						console.log(
							chalk.grey('Finished running one-off task @ %s'),
							new Date()
						);
					});
				}
				reply().code(202);
			});
		},
		config: {
			validate: {
				query: {}
			}
		}
	});

	// Get results for a task
	server.route({
		method: 'GET',
		path: '/tasks/{id}/results',
		handler: function(req, reply) {
			model.task.getById(req.params.id, function(err, task) {
				if (err) {
					return reply().code(500);
				}
				if (!task) {
					return reply({
						code: 404,
						error: 'Not Found'
					}).code(404);
				}
				model.result.getByTaskId(req.params.id, req.query, function(err, results) {
					if (err || !results) {
						return reply().code(500);
					}
					reply(results).code(200);
				});
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

	// Get a result for a task
	server.route({
		method: 'GET',
		path: '/tasks/{tid}/results/{rid}',
		handler: function(req, reply) {
			var rid = req.params.rid;
			var tid = req.params.tid;
			model.result.getByIdAndTaskId(rid, tid, req.query, function(err, result) {
				if (err) {
					return reply().code(500);
				}
				if (!result) {
					return reply({
						code: 404,
						error: 'Not Found'
					}).code(404);
				}
				reply(result).code(200);
			});
		},
		config: {
			validate: {
				query: {
					full: Joi.boolean()
				},
				payload: false
			}
		}
	});

};
