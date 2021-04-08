const { URL } = require('../constants');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const uploadBody = async (body) => {
  const response = await fetch(URL, { method: 'POST', body });
  return response;
};

describe('image upload', () => {
  test('signup test', async () => {
    const body = new FormData();

    expect(data.body.error).toBe(null || undefined);
  });
});
