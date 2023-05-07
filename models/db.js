const { Model } = require("objection")
const db = require("../../../knexfile")

const knex = require('knex')(db)

Model.knex(knex)

class Attachment extends Model {
	static get tableName() {
		return 'apattachments';
	}
}

class Activity extends Model {
	static get tableName() {
		return 'apactivities';
	}

	static get relationMappings() {
		return {
			message: {
				relation: Model.HasOneRelation,
				modelClass: Message,
				join: {
					from: 'apactivities.object',
					to: 'apmessages.uri'
				}
			},
			creator: {
				relation: Model.HasOneRelation,
				modelClass: Account,
				join: {
					from: 'apactivities.actor',
					to: 'apaccounts.uri'
				}
			},
		}
	}
}

class Addressee extends Model {
	static get tableName() {
		return 'apaddressee';
	}
}

class Vote extends Model {
	static get tableName() {
		return 'apoptions_votes';
	}
}

class Tag extends Model {
	static get tableName() {
		return 'aptags';
	}

	static get relationMappings() {
		return {
			messages: {
				relation: Model.HasManyRelation,
				modelClass: Message,
				join: {
					from: 'aptags.message_uri',
					to: 'apmessages.uri'
				}
			}
		}
	}
}

class Like extends Model {
	static get tableName() {
		return 'aplikes';
	}

	static get relationMappings() {
		return {
			sender: {
				relation: Model.HasOneRelation,
				modelClass: Account,
				join: {
					from: 'aplikes.account_uri',
					to: 'apaccounts.uri'
				}
			},
		}
	}
}

class Announce extends Model {
	static get tableName() {
		return 'apannounces';
	}

	static get relationMappings() {
		return {
			sender: {
				relation: Model.HasOneRelation,
				modelClass: Account,
				join: {
					from: 'apannounces.account_uri',
					to: 'apaccounts.uri'
				}
			},
		}
	}
}

class Option extends Model {
	static get tableName() {
		return 'apoptions';
	}
}

class Follower extends Model {
	static get tableName() {
		return 'apfollowers';
	}
}

class AccountLink extends Model {
	static get tableName() {
		return 'apaccounts_link';
	}
}

class Account extends Model {
	static get tableName() {
		return 'apaccounts';
	}

	static get relationMappings() {
		return {
			followers: {
				relation: Model.ManyToManyRelation,
				modelClass: Account,
				join: {
					from: 'apaccounts.uri',
					through: {
						from: 'apfollowers.username',
						to: 'apfollowers.follower'
					},
					to: 'apaccounts.uri'
				}
			},
			following: {
				relation: Model.ManyToManyRelation,
				modelClass: Account,
				join: {
					from: 'apaccounts.uri',
					through: {
						from: 'apfollowers.follower',
						to: 'apfollowers.username'
					},
					to: 'apaccounts.uri'
				}
			},
			links: {
				relation: Model.HasManyRelation,
				modelClass: AccountLink,
				join: {
					from: 'apaccounts.uri',
					to: 'apaccounts_link.user_uri'
				}
			}
		}
	}
}

class Message extends Model {
	static get tableName() {
		return 'apmessages';
	}

	static get relationMappings() {
		return {
			creator: {
				relation: Model.HasOneRelation,
				modelClass: Account,
				join: {
					from: 'apmessages.attributedTo',
					to: 'apaccounts.uri'
				}
			},
			addressees: {
				relation: Model.ManyToManyRelation,
				modelClass: Account,
				join: {
					from: 'apmessages.uri',
					through: {
						from: 'apaddressee.message_uri',
						to: 'apaddressee.account_uri',
						extra: { field: 'field', type: 'type' }
					},
					to: 'apaccounts.uri'
				}
			},
			attachments: {
				relation: Model.HasManyRelation,
				modelClass: Attachment,
				join: {
					from: 'apmessages.uri',
					to: 'apattachments.message_uri'
				}
			},
			tags: {
				relation: Model.HasManyRelation,
				modelClass: Tag,
				join: {
					from: 'apmessages.uri',
					to: 'aptags.message_uri'
				}
			},
			replies: {
				relation: Model.HasManyRelation,
				modelClass: Message,
				join: {
					from: 'apmessages.uri',
					to: 'apmessages.inReplyTo'
				}
			},
			repliedto: {
				relation: Model.HasOneRelation,
				modelClass: Message,
				join: {
					from: 'apmessages.inReplyTo',
					to: 'apmessages.uri'
				}
			},
			likes: {
				relation: Model.HasManyRelation,
				modelClass: Like,
				join: {
					from: 'apmessages.uri',
					to: 'aplikes.message_uri'
				}
			},
			announces: {
				relation: Model.HasManyRelation,
				modelClass: Announce,
				join: {
					from: 'apmessages.uri',
					to: 'apannounces.message_uri'
				}
			},
			options: {
				relation: Model.HasManyRelation,
				modelClass: Option,
				join: {
					from: 'apmessages.uri',
					to: 'apoptions.message_uri'
				}
			}
		}
	}
}

class Request extends Model {
	static get tableName() {
		return 'aprequests';
	}
}

module.exports = { Tag, Account, Message, Attachment, Like, Announce, Option, Request, Follower, Activity, Vote, Addressee, AccountLink }