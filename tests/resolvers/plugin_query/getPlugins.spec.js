const database = require('../../../db');
const shortid = require('shortid');
const User = require('../../../lib/models/User');
const Organization = require('../../../lib/models/Organization');
const Post = require('../../../lib/models/Post');
require('../../../lib/models/Plugin');
const getPlugins = require('../../../lib/resolvers/plugin_query/getPlugins');
let user;
let org;
let post;
beforeAll(async () => {
    require('dotenv').config(); // pull env variables from .env file
    await database.connect();
});

afterAll(() => {
    database.disconnect();
});

describe('Post query testing for post resolver', () => {
    test('Find existing post by post id', async () => {
        const response = await getPlugins();
        expect(response).toBeTruthy()
    });
});